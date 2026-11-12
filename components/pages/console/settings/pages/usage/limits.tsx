"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress";
import { createClient, getWorkspaceId } from "@/lib/client";
import { formatUsd } from "./breakdown";

const PERIODS = [
  { key: "day", column: "daily_limit_usd", label: "Daily" },
  { key: "week", column: "weekly_limit_usd", label: "Weekly" },
  { key: "month", column: "monthly_limit_usd", label: "Monthly" },
] as const;

type Period = (typeof PERIODS)[number];
type Values = Record<Period["key"], number | null>;

const EMPTY: Values = { day: null, week: null, month: null };

// Spending limits in USD, across whichever models are in use.
export function UsageLimits() {
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [limits, setLimits] = useState<Values>(EMPTY);
  const [spend, setSpend] = useState<Record<Period["key"], number>>({ day: 0, week: 0, month: 0 });
  const [drafts, setDrafts] = useState<Record<Period["key"], string>>({ day: "", week: "", month: "" });
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const orgId = await getWorkspaceId();
    setOrganizationId(orgId);
    if (orgId) {
      const supabase = createClient();
      const [{ data: settings }, { data: spendRows }] = await Promise.all([
        supabase
          .from("agent_settings")
          .select("daily_limit_usd, weekly_limit_usd, monthly_limit_usd")
          .eq("organization_id", orgId)
          .maybeSingle(),
        supabase.rpc("ai_spend", { p_org: orgId }),
      ]);

      const next: Values = { day: null, week: null, month: null };
      for (const period of PERIODS) {
        const raw = (settings as Record<string, number | string | null> | null)?.[period.column];
        next[period.key] = raw === null || raw === undefined ? null : Number(raw);
      }
      setLimits(next);
      setDrafts({
        day: next.day?.toString() ?? "0",
        week: next.week?.toString() ?? "0",
        month: next.month?.toString() ?? "0",
      });

      const row = (spendRows as { day: number; week: number; month: number }[] | null)?.[0];
      setSpend({ day: Number(row?.day ?? 0), week: Number(row?.week ?? 0), month: Number(row?.month ?? 0) });
    }
    setReady(true);
  }, []);

  useEffect(() => {
    // Loads once on mount; state is set after the requests finish.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const changed = PERIODS.some((period) => drafts[period.key] !== (limits[period.key]?.toString() ?? "0"));

  async function save() {
    if (!organizationId) return;

    const parsed: Values = { day: null, week: null, month: null };
    for (const period of PERIODS) {
      const text = drafts[period.key].trim();
      // Empty or 0 means no limit.
      if (text === "" || Number(text) === 0) continue;
      const value = Number(text);
      if (!Number.isFinite(value) || value < 0.01 || value > 100000) {
        toast.error(`${period.label} limit must be 0 (no limit) or between $0.01 and $100,000.`);
        return;
      }
      parsed[period.key] = Math.round(value * 100) / 100;
    }

    const { day, week, month } = parsed;
    if ((day && week && day > week) || (week && month && week > month) || (day && month && day > month)) {
      toast.error("A shorter period can't have a higher limit than a longer one.");
      return;
    }

    setSaving(true);
    const { error } = await createClient().from("agent_settings").upsert({
      organization_id: organizationId,
      daily_limit_usd: day,
      weekly_limit_usd: week,
      monthly_limit_usd: month,
    });
    setSaving(false);

    if (error) {
      toast.error("Couldn't save. Only owners and admins can change limits.");
      return;
    }
    toast.success("Limits saved.");
    await load();
  }

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-medium">Limits</h3>

      <form
        className="space-y-4 rounded-lg border p-3"
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
      >
        {PERIODS.map((period) => {
          const limit = limits[period.key];
          const used = spend[period.key];
          const id = `limit-${period.key}`;
          return (
            <div key={period.key} className="space-y-2">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <Label htmlFor={id}>{period.label}</Label>
                <div className="relative">
                  <span
                    aria-hidden
                    className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-sm"
                  >
                    $
                  </span>
                  <Input
                    id={id}
                    type="number"
                    inputMode="decimal"
                    min={0}
                    max={100000}
                    step="0.01"
                    placeholder="0"
                    className="w-32 pl-6"
                    disabled={!ready || !organizationId}
                    value={drafts[period.key]}
                    onChange={(event) =>
                      setDrafts((current) => ({ ...current, [period.key]: event.target.value }))
                    }
                  />
                </div>
              </div>

              {limit ? (
                <Progress value={Math.min(used, limit)} max={limit}>
                  <ProgressLabel className="text-muted-foreground text-xs font-normal">
                    Spent
                  </ProgressLabel>
                  <ProgressValue className="text-xs">
                    {() => `${formatUsd(used)} / ${formatUsd(limit)}`}
                  </ProgressValue>
                </Progress>
              ) : null}
            </div>
          );
        })}

        <Button type="submit" size="sm" disabled={saving || !organizationId || !changed}>
          {saving ? "Saving…" : "Save limits"}
        </Button>
      </form>
    </section>
  );
}
