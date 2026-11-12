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
import { formatUsd, PROVIDER_LABELS } from "./breakdown";

type Entry = {
  id: string;
  provider: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
  created_at: string;
};

// The most recent replies.
export function UsageHistory() {
  const [entries, setEntries] = useState<Entry[] | null>(null);

  useEffect(() => {
    async function load() {
      const { data } = await createClient()
        .from("ai_usage")
        .select("id, provider, model, input_tokens, output_tokens, cost_usd, created_at")
        .order("created_at", { ascending: false })
        .limit(20);
      setEntries((data as Entry[] | null) ?? []);
    }
    void load();
  }, []);

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-medium">History</h3>

      {entries === null ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : entries.length === 0 ? (
        <p className="text-muted-foreground rounded-lg border border-dashed p-4 text-center text-sm">
          No history yet.
        </p>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Model</TableHead>
                <TableHead className="text-right">Tokens</TableHead>
                <TableHead className="text-right">Est. cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="whitespace-nowrap">
                    {new Date(entry.created_at).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </TableCell>
                  <TableCell>{PROVIDER_LABELS[entry.provider] ?? entry.provider}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {(entry.input_tokens + entry.output_tokens).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatUsd(Number(entry.cost_usd))}
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
