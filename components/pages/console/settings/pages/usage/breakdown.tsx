"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createClient } from "@/lib/client";

export const PROVIDER_LABELS: Record<string, string> = {
  platform: "Built-in",
  anthropic: "Claude",
  openai: "OpenAI",
  gemini: "Gemini",
};

// Small amounts keep four decimals so a single reply doesn't show as $0.00.
export function formatUsd(value: number) {
  return value > 0 && value < 0.01 ? `$${value.toFixed(4)}` : `$${value.toFixed(2)}`;
}

type Row = {
  provider: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
};

type Group = { key: string; provider: string; model: string; messages: number; tokens: number; cost: number };

// Usage by model over the last 30 days.
export function UsageBreakdown() {
  const [groups, setGroups] = useState<Group[] | null>(null);

  useEffect(() => {
    async function load() {
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data } = await createClient()
        .from("ai_usage")
        .select("provider, model, input_tokens, output_tokens, cost_usd")
        .gte("created_at", since)
        .limit(5000);

      const byModel = new Map<string, Group>();
      for (const row of (data as Row[] | null) ?? []) {
        const key = `${row.provider}:${row.model}`;
        const group = byModel.get(key) ?? {
          key,
          provider: row.provider,
          model: row.model,
          messages: 0,
          tokens: 0,
          cost: 0,
        };
        group.messages += 1;
        group.tokens += row.input_tokens + row.output_tokens;
        group.cost += Number(row.cost_usd);
        byModel.set(key, group);
      }
      setGroups([...byModel.values()].sort((a, b) => b.messages - a.messages));
    }
    void load();
  }, []);

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-medium">Breakdown</h3>

      {groups === null ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : groups.length === 0 ? (
        <p className="text-muted-foreground rounded-lg border border-dashed p-4 text-center text-sm">
          No usage yet.
        </p>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Model</TableHead>
                <TableHead className="text-right">Messages</TableHead>
                <TableHead className="text-right">Tokens</TableHead>
                <TableHead className="text-right">Est. cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups.map((group) => (
                <TableRow key={group.key}>
                  <TableCell>
                    <span className="font-medium">{PROVIDER_LABELS[group.provider] ?? group.provider}</span>
                    <span className="text-muted-foreground block text-xs">{group.model}</span>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {group.messages.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {group.tokens.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatUsd(group.cost)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  );
}
