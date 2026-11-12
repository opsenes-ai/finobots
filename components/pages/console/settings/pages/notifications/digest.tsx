"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { createClient } from "@/lib/client";
import { cn } from "@/lib/utils";

type Digest = "off" | "daily" | "weekly";

const OPTIONS: { value: Digest; label: string }[] = [
  { value: "off", label: "Off" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
];

// How often the summary email is sent. Weekly by default.
export function NotificationsDigest() {
  const [userId, setUserId] = useState<string | null>(null);
  const [digest, setDigest] = useState<Digest>("weekly");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;
      setUserId(auth.user.id);
      const { data } = await supabase
        .from("notification_preferences")
        .select("digest")
        .eq("user_id", auth.user.id)
        .maybeSingle();
      if (data?.digest) setDigest(data.digest as Digest);
    }
    void load();
  }, []);

  async function change(next: Digest) {
    if (!userId) return;
    const previous = digest;
    setDigest(next);
    const { error } = await createClient()
      .from("notification_preferences")
      .upsert({ user_id: userId, digest: next });
    if (error) {
      setDigest(previous);
      toast.error("Couldn't save. Try again.");
    }
  }

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-medium">Digest</h3>
      <RadioGroup
        value={digest}
        disabled={!userId}
        onValueChange={(value) => void change(value as Digest)}
        aria-label="Digest frequency"
        className="grid-cols-3"
      >
        {OPTIONS.map((option) => (
          <Label
            key={option.value}
            htmlFor={`digest-${option.value}`}
            className={cn(
              "flex cursor-pointer items-center gap-2 rounded-lg border p-3 font-normal",
              digest === option.value && "border-primary"
            )}
          >
            <RadioGroupItem id={`digest-${option.value}`} value={option.value} />
            {option.label}
          </Label>
        ))}
      </RadioGroup>
    </section>
  );
}
