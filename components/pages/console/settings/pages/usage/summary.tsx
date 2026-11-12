"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress";
import { createClient } from "@/lib/client";

type Credits = { balance: number; cap: number; daily_topup: number };
type Totals = { messages: number; tokens: number };

// Credits left, plus messages and tokens over the last 30 days.
export function UsageSummary() {
  const [credits, setCredits] = useState<Credits | null>(null);
  const [totals, setTotals] = useState<Totals | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const [{ data: creditRows }, { data: usage }] = await Promise.all([
        supabase.rpc("my_ai_credits"),
        supabase.from("ai_usage").select("input_tokens, output_tokens").gte("created_at", since).limit(5000),
      ]);

      const row = (creditRows as Credits[] | null)?.[0];
      if (row) {
        setCredits({
          balance: Number(row.balance),
          cap: Number(row.cap),
          daily_topup: Number(row.daily_topup),
        });
      }

      const list = (usage as { input_tokens: number; output_tokens: number }[] | null) ?? [];
      setTotals({
        messages: list.length,
        tokens: list.reduce((sum, item) => sum + item.input_tokens + item.output_tokens, 0),
      });
    }
    void load();
  }, []);

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-medium">Summary</h3>

      <Card>
        <CardHeader>
          <CardTitle>Credits</CardTitle>
          <CardDescription>+{credits ? credits.daily_topup : 5} every day</CardDescription>
        </CardHeader>
        <CardContent>
          {credits ? (
            <Progress value={credits.balance} max={credits.cap}>
              <ProgressLabel>Remaining</ProgressLabel>
              <ProgressValue>
                {() => `${credits.balance.toFixed(2)} / ${credits.cap}`}
              </ProgressValue>
            </Progress>
          ) : (
            <p className="text-muted-foreground text-sm">Loading…</p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card size="sm">
          <CardHeader>
            <CardDescription>Messages, last 30 days</CardDescription>
            <CardTitle className="text-2xl tabular-nums">
              {totals ? totals.messages.toLocaleString() : "–"}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardDescription>Tokens, last 30 days</CardDescription>
            <CardTitle className="text-2xl tabular-nums">
              {totals ? totals.tokens.toLocaleString() : "–"}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
    </section>
  );
}
