// Process requests, stream AI responses, and propose actions.
//
// POST { organization_id, chat_id?, messages: [{ role, content }] }
//
// Any member. Streams Server-Sent Events:
//   { type: "text", delta }                    a piece of the reply
//   { type: "action", action, requires_approval: true }
//                                               a proposed action; nothing runs
//                                               until the user approves it and
//                                               the app calls the actions function
//   { type: "error", message }  then  { type: "done" }
//
// Uses any OpenAI-compatible chat completions API. Secrets:
//   AI_API_KEY, AI_MODEL, AI_BASE_URL (default https://api.openai.com/v1)
// The conversation comes from the request; messages aren't stored yet.

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

const PROPOSABLE = new Set(["send_invoice", "send_reminder"]);

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
            // Only pass on well-formed proposals for supported actions.
            if (!PROPOSABLE.has(String(args.action)) || typeof args.invoice_id !== "string") {
              continue;
            }
            send({
              type: "action",
              action: {
                action: args.action,
                invoice_id: args.invoice_id,
                note: typeof args.note === "string" ? args.note : undefined,
                summary: typeof args.summary === "string" ? args.summary : undefined,
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
