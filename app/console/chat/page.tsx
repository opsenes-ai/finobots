"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageInput } from "@/components/pages/console/chat/ui/message-input";

// Read by /console/chat/[chatId] to show the first message.
const PENDING_MESSAGE_KEY = "finobots:pending-message";

// Kept outside the component so render stays pure.
function createChatId() {
  return crypto.randomUUID();
}

export default function NewChatPage() {
  const router = useRouter();
  const [input, setInput] = useState("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = input.trim();
    if (!text) return;

    sessionStorage.setItem(PENDING_MESSAGE_KEY, text);
    router.push(`/console/chat/${createChatId()}`);
  };

  return (
    // Fills the console area below the 4rem header and inside the p-6 padding,
    // with the heading and input centred in it.
    <div className="flex h-[calc(100svh-7rem)] items-center justify-center">
      <div className="w-full max-w-2xl space-y-6">
        <h1 className="text-center text-2xl font-semibold tracking-tight sm:text-3xl">
          How can I help with your finances?
        </h1>
        <form onSubmit={handleSubmit}>
          <MessageInput
            value={input}
            onChange={(event) => setInput(event.target.value)}
            isGenerating={false}
          />
        </form>
      </div>
    </div>
  );
}
