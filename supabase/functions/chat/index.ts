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
// Uses any OpenAI-compatible chat completions API. Secrets:
//   AI_API_KEY, AI_MODEL, AI_BASE_URL (default https://api.openai.com/v1)
// The conversation comes from the request; messages aren't stored yet.
// Proposed actions are stored, with chat_id when one is given.

import { requireOrgMember, requireUser } from "../_shared/auth.ts";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
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

function env(name: string, fallback?: string): string {
  const value = Deno.env.get(name) ?? fallback;
  if (!value) throw new Error(`Missing environment variable ${name}`);
  return value;
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

    const upstream = await fetch(
      `${env("AI_BASE_URL", "https://api.openai.com/v1").replace(/\/$/, "")}/chat/completions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env("AI_API_KEY")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: env("AI_MODEL"),
          stream: true,
          tools: TOOLS,
          messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
        }),
      },
    );

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
              if (delta?.content) send({ type: "text", delta: delta.content });

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
