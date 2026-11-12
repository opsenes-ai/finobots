"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Chat } from "@/components/pages/console/chat/ui/chat";
import type { Message } from "@/components/pages/console/chat/ui/chat-message";
import { createClient, functionErrorMessage, getWorkspaceId } from "@/lib/client";

// Set by /console/chat when the first message is sent.
const PENDING_MESSAGE_KEY = "finobots:pending-message";

// How many past messages are sent along with a new one.
const HISTORY_LIMIT = 50;

// What the assistant is looking up, shown while it works.
const TOOL_LABELS: Record<string, string> = {
  get_accounts: "your accounts",
  search_transactions: "your transactions",
  get_cashflow: "your cash flow",
  get_connections: "your connections",
  get_approvals: "your approvals",
};

type Proposal = { id: string; summary: string; type: string; invoiceId: string };

// Kept outside the component so render stays pure.
function createMessage(role: Message["role"], content: string): Message {
  return { id: crypto.randomUUID(), role, content, createdAt: new Date() };
}

// Actions the agent has proposed. Nothing runs until you approve it.
function ProposedActions({
  items,
  busyId,
  onDecide,
}: {
  items: Proposal[];
  busyId: string | null;
  onDecide: (id: string, decision: "approve" | "reject") => void;
}) {
  if (items.length === 0) return null;
  return (
    <ul className="mb-3 space-y-2" aria-label="Actions waiting for approval">
      {items.map((item) => (
        <li
          key={item.id}
          className="bg-card flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
        >
          <div className="min-w-0">
            <p className="text-sm font-medium">
              {item.type === "send_invoice" ? "Send invoice" : "Send reminder"} · {item.invoiceId}
            </p>
            <p className="text-muted-foreground text-xs">{item.summary}</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={busyId !== null}
              onClick={() => onDecide(item.id, "reject")}
            >
              Reject
            </Button>
            <Button size="sm" disabled={busyId !== null} onClick={() => onDecide(item.id, "approve")}>
              {busyId === item.id ? "Working…" : "Approve"}
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}

function ChatSession() {
  const { chatId } = useParams<{ chatId: string }>();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [generating, setGenerating] = useState(false);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [deciding, setDeciding] = useState<string | null>(null);

  const organizationId = useRef<string | null>(null);
  const userId = useRef<string | null>(null);
  const chatExists = useRef(false);
  const started = useRef(false);
  const abort = useRef<AbortController | null>(null);
  // Messages that were errors, so they aren't sent back to the model.
  const errorIds = useRef(new Set<string>());

  async function send(text: string, history: Message[]) {
    const orgId = organizationId.current;
    const uid = userId.current;
    if (!orgId || !uid) {
      toast.error("Couldn't find your workspace. Try signing in again.");
      return;
    }

    const supabase = createClient();
    const userMessage = createMessage("user", text);
    setMessages([...history, userMessage]);
    setGenerating(true);

    // The chat is created with its first message.
    if (!chatExists.current) {
      const { error } = await supabase.from("chats").insert({
        id: chatId,
        organization_id: orgId,
        user_id: uid,
        title: text.slice(0, 60),
      });
      if (error) {
        toast.error("Couldn't start the chat. Try again.");
        setGenerating(false);
        return;
      }
      chatExists.current = true;
    }
    await supabase.from("chat_messages").insert({ chat_id: chatId, role: "user", content: text });

    const assistantId = crypto.randomUUID();
    let reply = "";
    let failed: string | null = null;
    let proposed = false;
    const controller = new AbortController();
    abort.current = controller;

    const show = (content: string) =>
      setMessages((current) => {
        const exists = current.some((message) => message.id === assistantId);
        if (!exists) {
          return [...current, { id: assistantId, role: "assistant", content, createdAt: new Date() }];
        }
        return current.map((message) => (message.id === assistantId ? { ...message, content } : message));
      });

    try {
      const { data: auth } = await supabase.auth.getSession();
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/chat`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${auth.session?.access_token}`,
          apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organization_id: orgId,
          chat_id: chatId,
          messages: [...history, userMessage]
            .filter((message) => !errorIds.current.has(message.id))
            .slice(-HISTORY_LIMIT)
            .map((message) => ({ role: message.role, content: message.content })),
        }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        failed = await functionErrorMessage({ context: response });
      } else {
        const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
        let buffer = "";
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += value;
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data:")) continue;
            let event: {
              type: string;
              delta?: string;
              message?: string;
              name?: string;
              action_id?: string;
              action?: { action: string; invoice_id: string; summary?: string };
            };
            try {
              event = JSON.parse(line.slice(5).trim());
            } catch {
              continue;
            }

            if (event.type === "text" && event.delta) {
              reply += event.delta;
              show(reply);
            } else if (event.type === "action" && event.action_id && event.action) {
              proposed = true;
              const action = event.action;
              setProposals((current) => [
                ...current,
                {
                  id: event.action_id!,
                  type: action.action,
                  invoiceId: action.invoice_id,
                  summary: action.summary ?? "",
                },
              ]);
            } else if (event.type === "tool" && event.name) {
              // Shown until the reply starts, so the wait has a reason.
              if (!reply) show(`_Checking ${TOOL_LABELS[event.name] ?? "your data"}…_`);
            } else if (event.type === "error") {
              failed = event.message ?? "The response was interrupted.";
            }
          }
        }
      }
    } catch (error) {
      if ((error as Error).name !== "AbortError") failed = "Couldn't reach the assistant. Try again.";
    }

    if (!reply) {
      if (failed) {
        errorIds.current.add(assistantId);
        show(failed);
      } else if (proposed) {
        reply = "I've drafted an action for you to review above.";
        show(reply);
      } else {
        reply = "I couldn't come up with a reply. Try rephrasing.";
        show(reply);
      }
    }

    if (reply) {
      await supabase.from("chat_messages").insert({ chat_id: chatId, role: "assistant", content: reply });
    }
    abort.current = null;
    setGenerating(false);
  }

  // Load this chat if it exists, then send the first message if there is one.
  useEffect(() => {
    if (started.current) return;
    started.current = true;

    async function load() {
      const supabase = createClient();
      const [orgId, { data: auth }] = await Promise.all([getWorkspaceId(), supabase.auth.getUser()]);
      organizationId.current = orgId;
      userId.current = auth.user?.id ?? null;

      const { data: chat } = await supabase.from("chats").select("id").eq("id", chatId).maybeSingle();
      let history: Message[] = [];

      if (chat) {
        chatExists.current = true;
        const [{ data: rows }, { data: pending }] = await Promise.all([
          supabase
            .from("chat_messages")
            .select("id, role, content, created_at")
            .eq("chat_id", chatId)
            .order("created_at", { ascending: true }),
          supabase
            .from("agent_actions")
            .select("id, type, payload, summary")
            .eq("chat_id", chatId)
            .eq("status", "proposed"),
        ]);

        history = (rows ?? []).map((row) => ({
          id: row.id as string,
          role: row.role as string,
          content: row.content as string,
          createdAt: new Date(row.created_at as string),
        }));
        setMessages(history);
        setProposals(
          (pending ?? []).map((row) => ({
            id: row.id as string,
            type: row.type as string,
            invoiceId: String((row.payload as { invoice_id?: string } | null)?.invoice_id ?? ""),
            summary: (row.summary as string | null) ?? "",
          }))
        );
      }

      const text = sessionStorage.getItem(PENDING_MESSAGE_KEY);
      if (text) {
        sessionStorage.removeItem(PENDING_MESSAGE_KEY);
        await send(text, history);
      }
    }
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function decide(id: string, decision: "approve" | "reject") {
    setDeciding(id);
    const { error } = await createClient().functions.invoke("actions", {
      body: { action_id: id, decision },
    });
    setDeciding(null);
    if (error) {
      toast.error(await functionErrorMessage(error));
      return;
    }
    setProposals((current) => current.filter((item) => item.id !== id));
    toast.success(decision === "approve" ? "Action approved and run." : "Action rejected.");
  }

  return (
    // Cancels the console's p-6 padding and fills the whole area, so the
    // message list scrolls with its scrollbar at the right edge of the screen
    // and the input stays at the bottom. The chat adds its own padding.
    <div className="-m-6 flex h-svh flex-col">
      {proposals.length > 0 ? (
        <div className="mx-auto w-full max-w-3xl px-6 pt-6">
          <ProposedActions items={proposals} busyId={deciding} onDecide={decide} />
        </div>
      ) : null}
      <div className="min-h-0 flex-1">
        <Chat
          className="h-full"
          messages={messages}
          input={input}
          handleInputChange={(event) => setInput(event.target.value)}
          handleSubmit={(event) => {
            event?.preventDefault?.();
            const text = input.trim();
            if (!text || generating) return;
            setInput("");
            void send(text, messages);
          }}
          isGenerating={generating}
          stop={() => abort.current?.abort()}
          setMessages={setMessages}
        />
      </div>
    </div>
  );
}

// The route param is read at request time, so it sits inside a Suspense boundary.
export default function ChatSessionPage() {
  return (
    <Suspense fallback={null}>
      <ChatSession />
    </Suspense>
  );
}
