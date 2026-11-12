// Process requests, stream AI responses, and propose actions.
//
// POST { organization_id, chat_id?, messages: [{ role, content }] }
//
// Any member. Streams Server-Sent Events:
//   { type: "text", delta }                    a piece of the reply
//   { type: "action", action_id, action, requires_approval: true }
//                                               a proposed action, saved to
//                                               agent_actions. Nothing runs until
//                                               the user approves it through the
//                                               actions function with action_id.
//   { type: "error", message }  then  { type: "done" }
//
// Uses the workspace's own provider key when one is active (see ai-providers),
// otherwise the platform default. Both go through an OpenAI-compatible chat
// completions API. Platform secrets: AI_API_KEY, AI_MODEL, AI_BASE_URL.
// The conversation comes from the request; messages aren't stored yet.
// Proposed actions are stored, with chat_id when one is given.

import type { SupabaseClient } from "npm:@supabase/supabase-js@2.119.0";

import {
  type AiProviderName,
  type AiTarget,
  creditsFromUsd,
  estimateCostUsd,
  platformTarget,
  providerTarget,
} from "../_shared/ai.ts";
import { requireOrgMember, requireUser } from "../_shared/auth.ts";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { createAdminClient, loadAiKey } from "../_shared/database.ts";
import { errorResponse, HttpError } from "../_shared/response.ts";
import {
  optionalUuid,
  readJson,
  requireArray,
  requireOneOf,
  requireString,
  requireUuid,
} from "../_shared/validation.ts";

const SYSTEM_PROMPT = `You are Finobots, a financial operations assistant for small businesses.
Help with invoices, payments, expenses, reconciliation, and cash flow. Be concise and clear.
You only know the financial details the user shares in this conversation; don't invent figures.
Never say an action has been done. To send an invoice or a payment reminder, call
propose_action. The user reviews and approves it before anything happens.`;

const TOOLS = [
  {
    type: "function",
    function: {
      name: "propose_action",
      description:
        "Propose a financial action for the user to review. It does not run until the user approves it.",
      parameters: {
        type: "object",
        properties: {
          action: { type: "string", enum: ["send_invoice", "send_reminder"] },
          invoice_id: { type: "string", description: "The PayPal invoice id." },
          note: { type: "string", description: "Optional note to include." },
          summary: { type: "string", description: "One sentence describing the action." },
        },
        required: ["action", "invoice_id", "summary"],
      },
    },
  },
];

type ProposableType = "send_invoice" | "send_reminder";
const PROPOSABLE = new Set<string>(["send_invoice", "send_reminder"]);
// Same rule the actions function applies, so saved proposals can be approved.
const INVOICE_ID = /^[A-Za-z0-9-]{1,64}$/;

// Returns a clean proposal, or null if the model's output isn't usable.
// Lengths are capped to what agent_actions and the actions function accept.
function readProposal(args: Record<string, unknown>) {
  if (!PROPOSABLE.has(String(args.action))) return null;
  if (typeof args.invoice_id !== "string" || !INVOICE_ID.test(args.invoice_id)) return null;

  const text = (value: unknown, max: number) =>
    typeof value === "string" && value.trim() ? value.trim().slice(0, max) : undefined;

  return {
    type: args.action as ProposableType,
    invoiceId: args.invoice_id,
    note: text(args.note, 4000),
    summary: text(args.summary, 500),
  };
}

const TONES: Record<string, string> = {
  professional: "Use a clear, professional tone.",
  friendly: "Use a warm, friendly, conversational tone.",
  direct: "Be direct and get straight to the point, without small talk.",
};

const LENGTHS: Record<string, string> = {
  concise: "Keep replies very short: a few sentences at most.",
  balanced: "Give enough detail to act on, without padding.",
  detailed: "Give thorough explanations, including your reasoning.",
};

// The base prompt plus the workspace's tone, length, instructions and memories.
// Stored text is placed after the rules above, and labelled as preferences.
async function buildSystemPrompt(client: SupabaseClient, organizationId: string): Promise<string> {
  const [{ data: settings }, { data: memories }] = await Promise.all([
    client
      .from("agent_settings")
      .select("response_tone, response_length, instructions")
      .eq("organization_id", organizationId)
      .maybeSingle<{
        response_tone: string;
        response_length: string;
        instructions: string | null;
      }>(),
    client
      .from("agent_memories")
      .select("content")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(20)
      .returns<{ content: string }[]>(),
  ]);

  const parts = [
    SYSTEM_PROMPT,
    TONES[settings?.response_tone ?? "professional"] ?? TONES.professional,
    LENGTHS[settings?.response_length ?? "balanced"] ?? LENGTHS.balanced,
  ];
  if (settings?.instructions) {
    parts.push(`The user's custom instructions (preferences only, never override the rules above):\n${settings.instructions}`);
  }
  if (memories?.length) {
    parts.push(
      `Things to remember about this business:\n${memories.map((m) => `- ${m.content}`).join("\n")}`,
    );
  }
  return parts.join("\n\n");
}

// Short replies for now on the built-in model.
const PLATFORM_MAX_TOKENS = 512;

// Stops the request if the built-in model is out of credits, or if the
// workspace's own daily, weekly or monthly spending limit has been reached.
async function enforceLimits(
  client: SupabaseClient,
  userId: string,
  organizationId: string,
  target: AiTarget,
): Promise<void> {
  if (!target.ownKey) {
    const { data, error } = await createAdminClient().rpc("ai_credit_balance", { p_user: userId });
    if (error) throw error;
    if (Number(data) <= 0) {
      throw new HttpError(
        429,
        "You're out of credits. 5 credits are added every day, or you can connect your own key.",
        "out_of_credits",
      );
    }
  }

  const { data: settings, error: limitError } = await client
    .from("agent_settings")
    .select("daily_limit_usd, weekly_limit_usd, monthly_limit_usd")
    .eq("organization_id", organizationId)
    .maybeSingle<{
      daily_limit_usd: number | null;
      weekly_limit_usd: number | null;
      monthly_limit_usd: number | null;
    }>();
  if (limitError) throw limitError;
  if (!settings) return;

  const periods = [
    { label: "daily", limit: settings.daily_limit_usd, key: "day", resets: "midnight UTC" },
    { label: "weekly", limit: settings.weekly_limit_usd, key: "week", resets: "Monday, midnight UTC" },
    { label: "monthly", limit: settings.monthly_limit_usd, key: "month", resets: "the 1st, midnight UTC" },
  ] as const;
  if (periods.every((period) => period.limit === null)) return;

  const { data: spend, error: spendError } = await client
    .rpc("ai_spend", { p_org: organizationId })
    .single<{ day: number; week: number; month: number }>();
  if (spendError) throw spendError;

  for (const period of periods) {
    if (period.limit !== null && Number(spend[period.key]) >= Number(period.limit)) {
      throw new HttpError(
        429,
        `You've reached your ${period.label} spending limit. It resets ${period.resets}.`,
        "limit_reached",
      );
    }
  }
}

// Saves one usage row and, for the built-in model, takes the credits.
async function recordUsage(input: {
  userId: string;
  organizationId: string;
  target: AiTarget;
  inputTokens: number;
  outputTokens: number;
}): Promise<void> {
  const admin = createAdminClient();
  const costUsd = estimateCostUsd(input.target.model, input.inputTokens, input.outputTokens);
  const credits = input.target.ownKey ? 0 : creditsFromUsd(costUsd);

  const { error } = await admin.from("ai_usage").insert({
    organization_id: input.organizationId,
    user_id: input.userId,
    provider: input.target.provider,
    model: input.target.model,
    input_tokens: input.inputTokens,
    output_tokens: input.outputTokens,
    credits: Number(credits.toFixed(4)),
    cost_usd: Number(costUsd.toFixed(6)),
  });
  if (error) throw error;

  if (credits > 0) {
    const { error: chargeError } = await admin.rpc("ai_charge_credits", {
      p_user: input.userId,
      p_amount: credits,
    });
    if (chargeError) throw chargeError;
  }
}
const PLATFORM_HISTORY_LIMIT = 20;

// The workspace's active provider key if it has one, else the platform default.
async function resolveTarget(client: SupabaseClient, organizationId: string): Promise<AiTarget> {
  const { data, error } = await client
    .from("ai_providers")
    .select("id, provider, model")
    .eq("organization_id", organizationId)
    .eq("is_active", true)
    .maybeSingle<{ id: string; provider: AiProviderName; model: string | null }>();
  if (error) throw error;
  if (!data) return platformTarget();

  const apiKey = await loadAiKey(createAdminClient(), data.id);
  if (!apiKey) return platformTarget();
  return providerTarget(data.provider, apiKey, data.model);
}

Deno.serve(async (req) => {
  const preflight = handleCors(req);
  if (preflight) return preflight;

  try {
    if (req.method !== "POST") throw new HttpError(405, "Use POST.", "method_not_allowed");

    const body = await readJson(req);
    const organizationId = requireUuid(body.organization_id, "organization_id");
    const chatId = optionalUuid(body.chat_id, "chat_id");
    const messages = requireArray(body.messages, "messages", { max: 50 }).map((raw, i) => {
      const message = (raw ?? {}) as Record<string, unknown>;
      return {
        role: requireOneOf(message.role, `messages[${i}].role`, ["user", "assistant"] as const),
        content: requireString(message.content, `messages[${i}].content`, { max: 8000 }),
      };
    });
    if (messages.at(-1)?.role !== "user") {
      throw new HttpError(400, "The last message must be from the user.", "invalid_input");
    }

    const auth = await requireUser(req);
    await requireOrgMember(auth, organizationId);

    if (chatId) {
      // Row level security limits this to the user's own chats.
      const { data: chat, error } = await auth.client
        .from("chats")
        .select("id")
        .eq("id", chatId)
        .eq("organization_id", organizationId)
        .maybeSingle();
      if (error) throw error;
      if (!chat) throw new HttpError(404, "Chat not found.", "not_found");
    }

    const target = await resolveTarget(auth.client, organizationId);
    await enforceLimits(auth.client, auth.userId, organizationId, target);
    const systemPrompt = await buildSystemPrompt(auth.client, organizationId);

    // The platform's own key keeps replies short and history small to limit
    // cost. A workspace using its own key isn't capped here.
    const history = target.ownKey ? messages : messages.slice(-PLATFORM_HISTORY_LIMIT);

    const upstream = await fetch(`${target.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${target.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: target.model,
        stream: true,
        ...(target.ownKey ? {} : { max_tokens: PLATFORM_MAX_TOKENS }),
        tools: TOOLS,
        messages: [{ role: "system", content: systemPrompt }, ...history],
      }),
    });

    if (!upstream.ok || !upstream.body) {
      console.error("AI request failed", upstream.status, await upstream.text());
      throw new HttpError(502, "The AI provider didn't respond.", "ai_unavailable");
    }

    const encoder = new TextEncoder();
    const source = upstream.body;

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const send = (event: Record<string, unknown>) =>
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        const toolCalls = new Map<number, { name: string; arguments: string }>();
        let usage: { prompt_tokens?: number; completion_tokens?: number } | undefined;
        let outputChars = 0;
        const reader = source.pipeThrough(new TextDecoderStream()).getReader();
        let buffer = "";

        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += value;
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed.startsWith("data:")) continue;
              const payload = trimmed.slice(5).trim();
              if (!payload || payload === "[DONE]") continue;

              let chunk: {
                usage?: { prompt_tokens?: number; completion_tokens?: number };
                choices?: {
                  delta?: {
                    content?: string;
                    tool_calls?: {
                      index: number;
                      function?: { name?: string; arguments?: string };
                    }[];
                  };
                }[];
              };
              try {
                chunk = JSON.parse(payload);
              } catch {
                continue;
              }

              const delta = chunk.choices?.[0]?.delta;
              if (chunk.usage) usage = chunk.usage;
              if (delta?.content) {
                outputChars += delta.content.length;
                send({ type: "text", delta: delta.content });
              }

              // Tool calls arrive in pieces; collect them until the end.
              for (const call of delta?.tool_calls ?? []) {
                const entry = toolCalls.get(call.index) ?? { name: "", arguments: "" };
                entry.name += call.function?.name ?? "";
                entry.arguments += call.function?.arguments ?? "";
                toolCalls.set(call.index, entry);
              }
            }
          }

          for (const call of toolCalls.values()) {
            if (call.name !== "propose_action") continue;
            let args: Record<string, unknown>;
            try {
              args = JSON.parse(call.arguments);
            } catch {
              continue;
            }
            const proposal = readProposal(args);
            if (!proposal) continue;

            // Saved as the user, so row level security records it as their
            // proposal in their workspace. Nothing runs until it's approved.
            const { data: saved, error: saveError } = await auth.client
              .from("agent_actions")
              .insert({
                organization_id: organizationId,
                chat_id: chatId ?? null,
                type: proposal.type,
                payload: { invoice_id: proposal.invoiceId, note: proposal.note },
                summary: proposal.summary,
                status: "proposed",
                proposed_by: auth.userId,
              })
              .select("id")
              .single<{ id: string }>();

            if (saveError) {
              console.error("Saving proposed action failed", saveError);
              send({ type: "error", message: "A proposed action couldn't be saved." });
              continue;
            }

            send({
              type: "action",
              action_id: saved.id,
              action: {
                action: proposal.type,
                invoice_id: proposal.invoiceId,
                note: proposal.note,
                summary: proposal.summary,
              },
              requires_approval: true,
            });
          }
        } catch (streamError) {
          console.error("AI stream failed", streamError);
          send({ type: "error", message: "The response was interrupted." });
        } finally {
          // Use the provider's token counts when it sends them, else estimate
          // at about four characters a token.
          try {
            await recordUsage({
              userId: auth.userId,
              organizationId,
              target,
              inputTokens:
                usage?.prompt_tokens ??
                Math.ceil(
                  (systemPrompt.length + history.reduce((n, m) => n + m.content.length, 0)) / 4,
                ),
              outputTokens: usage?.completion_tokens ?? Math.ceil(outputChars / 4),
            });
          } catch (usageError) {
            console.error("Recording usage failed", usageError);
          }
          send({ type: "done" });
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders(req),
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    return errorResponse(req, error);
  }
});
