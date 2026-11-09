"use client";

import { useEffect, useState } from "react";
import { Chat } from "@/components/pages/console/chat/ui/chat";
import type { Message } from "@/components/pages/console/chat/ui/chat-message";

// Set by /console/chat when the first message is sent.
const PENDING_MESSAGE_KEY = "finobots:pending-message";

// Shown in place of an answer until the AI agent is wired up, so the chat
// never pretends to have replied.
const NOT_CONNECTED_NOTICE =
  "The Finobots agent isn't connected yet, so I can't answer this. Your message was not sent anywhere.";

// How long the typing indicator shows before the reply appears.
const REPLY_DELAY_MS = 900;

// Kept outside the component so render stays pure.
function createMessage(role: Message["role"], content: string): Message {
  return { id: crypto.randomUUID(), role, content, createdAt: new Date() };
}

function reply() {
  return createMessage("assistant", NOT_CONNECTED_NOTICE);
}

export default function ChatSessionPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");

  // Pick up the first message from the new chat page. The key is removed
  // inside the timer, so a dev-mode effect re-run doesn't drop the message.
  useEffect(() => {
    if (!sessionStorage.getItem(PENDING_MESSAGE_KEY)) return;

    const showMessage = window.setTimeout(() => {
      const text = sessionStorage.getItem(PENDING_MESSAGE_KEY);
      sessionStorage.removeItem(PENDING_MESSAGE_KEY);
      if (text) setMessages([createMessage("user", text)]);
    }, 0);
    const showReply = window.setTimeout(() => {
      setMessages((current) => (current.length ? [...current, reply()] : current));
    }, REPLY_DELAY_MS);

    return () => {
      window.clearTimeout(showMessage);
      window.clearTimeout(showReply);
    };
  }, []);

  // The chat shows a typing indicator while the last message is the user's.
  const isGenerating = messages.at(-1)?.role === "user";

  const send = (content: string) => {
    const text = content.trim();
    if (!text || isGenerating) return;

    setMessages((current) => [...current, createMessage("user", text)]);
    window.setTimeout(() => {
      setMessages((current) => [...current, reply()]);
    }, REPLY_DELAY_MS);
  };

  return (
    // Fills the console area below the 4rem header and inside the p-6 padding,
    // with the message input at the bottom.
    <div className="mx-auto flex h-[calc(100svh-7rem)] w-full max-w-3xl">
      <Chat
        className="h-full"
        messages={messages}
        input={input}
        handleInputChange={(event) => setInput(event.target.value)}
        handleSubmit={(event) => {
          event?.preventDefault?.();
          send(input);
          setInput("");
        }}
        isGenerating={isGenerating}
        setMessages={setMessages}
      />
    </div>
  );
}
