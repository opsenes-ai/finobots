"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { createClient } from "@/lib/client";

type Channel = "email_enabled" | "in_app_enabled";

const CHANNELS: { key: Channel; label: string }[] = [
  { key: "email_enabled", label: "Email" },
  { key: "in_app_enabled", label: "In-app" },
];

// Where notifications are delivered. Saved as soon as a switch is flipped.
export function NotificationsChannels() {
  const [userId, setUserId] = useState<string | null>(null);
  const [values, setValues] = useState<Record<Channel, boolean>>({
    email_enabled: true,
    in_app_enabled: true,
  });

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;
      setUserId(auth.user.id);
      const { data } = await supabase
        .from("notification_preferences")
        .select("email_enabled, in_app_enabled")
        .eq("user_id", auth.user.id)
        .maybeSingle();
      // No row yet means the defaults apply (both on).
      if (data) setValues(data as Record<Channel, boolean>);
    }
    void load();
  }, []);

  async function change(key: Channel, checked: boolean) {
    if (!userId) return;
    setValues((current) => ({ ...current, [key]: checked }));
    const { error } = await createClient()
      .from("notification_preferences")
      .upsert({ user_id: userId, [key]: checked });
    if (error) {
      setValues((current) => ({ ...current, [key]: !checked }));
      toast.error("Couldn't save. Try again.");
    }
  }

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-medium">Channels</h3>
      <div className="divide-y rounded-lg border">
        {CHANNELS.map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between gap-4 p-3">
            <Label htmlFor={key}>{label}</Label>
            <Switch
              id={key}
              checked={values[key]}
              disabled={!userId}
              onCheckedChange={(checked) => void change(key, checked)}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
