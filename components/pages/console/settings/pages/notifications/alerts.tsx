"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { createClient } from "@/lib/client";

type Alerts = { payments: boolean; invoices: boolean; approvals: boolean };

const ALERTS: { key: keyof Alerts; label: string; description: string }[] = [
  { key: "payments", label: "Payments", description: "Money received or sent." },
  { key: "invoices", label: "Invoices", description: "Paid, overdue or viewed." },
  { key: "approvals", label: "Approvals", description: "Actions waiting for you." },
];

// Which events notify you. Saved as soon as a switch is flipped.
export function NotificationsAlerts() {
  const [userId, setUserId] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<Alerts>({ payments: true, invoices: true, approvals: true });

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;
      setUserId(auth.user.id);
      const { data } = await supabase
        .from("notification_preferences")
        .select("alerts")
        .eq("user_id", auth.user.id)
        .maybeSingle();
      if (data?.alerts) setAlerts((current) => ({ ...current, ...(data.alerts as Partial<Alerts>) }));
    }
    void load();
  }, []);

  async function change(key: keyof Alerts, checked: boolean) {
    if (!userId) return;
    const previous = alerts;
    const next = { ...alerts, [key]: checked };
    setAlerts(next);
    const { error } = await createClient()
      .from("notification_preferences")
      .upsert({ user_id: userId, alerts: next });
    if (error) {
      setAlerts(previous);
      toast.error("Couldn't save. Try again.");
    }
  }

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-medium">Alerts</h3>
      <div className="divide-y rounded-lg border">
        {ALERTS.map(({ key, label, description }) => (
          <div key={key} className="flex items-center justify-between gap-4 p-3">
            <div>
              <Label htmlFor={`alert-${key}`}>{label}</Label>
              <p className="text-muted-foreground text-xs">{description}</p>
            </div>
            <Switch
              id={`alert-${key}`}
              checked={alerts[key]}
              disabled={!userId}
              onCheckedChange={(checked) => void change(key, checked)}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
