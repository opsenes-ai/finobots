"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { MessageInput } from "@/components/pages/console/chat/ui/message-input";

// Read by /console/chat/[chatId] to show the first message.
const PENDING_MESSAGE_KEY = "finobots:pending-message";

// Starting points that use the assistant's look-ups.
const PRESETS = [
  "List my accounts",
  "Show this month's transactions",
  "Summarise cash flow by category",
  "Forecast my USD balance",
  "What's waiting for approval?",
];

// Kept outside the component so render stays pure.
function createChatId() {
  return crypto.randomUUID();
}

export default function NewChatPage() {
  const router = useRouter();
  const [input, setInput] = useState("");

  // Set by /auth/callback when a PayPal sign-in used the email of an
  // existing account. The notice is shown once and removed from the URL.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("notice") !== "paypal-linked") return;

    toast.info("An account with this email already exists.", {
      description: "You're signed in to it, and PayPal is now linked to the same account.",
      duration: 8000,
    });
    url.searchParams.delete("notice");
    window.history.replaceState(null, "", url);
  }, []);

  // Opens a new chat that sends this as its first message.
  const start = (value: string) => {
    const text = value.trim();
    if (!text) return;
    sessionStorage.setItem(PENDING_MESSAGE_KEY, text);
    router.push(`/console/chat/${createChatId()}`);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    start(input);
  };

  return (
    // Fills the console area inside the p-6 padding, with the heading and
    // input centred in it.
    <div className="flex h-[calc(100svh-3rem)] items-center justify-center">
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
        <ul className="flex flex-wrap justify-center gap-2" aria-label="Suggested questions">
          {PRESETS.map((preset) => (
            <li key={preset}>
              <Button type="button" variant="outline" size="sm" onClick={() => start(preset)}>
                {preset}
              </Button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
