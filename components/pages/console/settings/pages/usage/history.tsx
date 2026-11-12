"use client";

import { useEffect, useState } from "react";
import type { ColDef } from "ag-grid-community";
import { DataGrid } from "@/components/ui/data-grid";
import { createClient } from "@/lib/client";
import { formatDate } from "@/lib/utils";
import { formatUsd, PROVIDER_LABELS } from "./breakdown";

type Entry = {
  id: string;
  provider: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  credits: number;
  cost_usd: number;
  created_at: string;
};

const columns: ColDef<Entry>[] = [
  { field: "created_at", headerName: "When", sort: "desc", width: 170, valueFormatter: (p) => formatDate(p.value, true) },
  { field: "provider", headerName: "Provider", width: 110, valueFormatter: (p) => PROVIDER_LABELS[p.value] ?? p.value },
  { field: "model", headerName: "Model", flex: 1, minWidth: 140 },
  { field: "input_tokens", headerName: "In", type: "rightAligned", width: 90, valueFormatter: (p) => Number(p.value).toLocaleString(), filter: "agNumberColumnFilter" },
  { field: "output_tokens", headerName: "Out", type: "rightAligned", width: 90, valueFormatter: (p) => Number(p.value).toLocaleString(), filter: "agNumberColumnFilter" },
  {
    field: "credits",
    headerName: "Credits",
    type: "rightAligned",
    width: 100,
    valueFormatter: (p) => (p.data?.provider === "platform" ? Number(p.value).toFixed(3) : "–"),
  },
  {
    field: "cost_usd",
    headerName: "Est. cost",
    type: "rightAligned",
    width: 110,
    valueFormatter: (p) => formatUsd(Number(p.value)),
    filter: "agNumberColumnFilter",
  },
];

// Every reply over the last 90 days, sortable and filterable.
export function UsageHistory() {
  const [entries, setEntries] = useState<Entry[] | null>(null);

  useEffect(() => {
    async function load() {
      const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
      const { data } = await createClient()
        .from("ai_usage")
        .select("id, provider, model, input_tokens, output_tokens, credits, cost_usd, created_at")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(1000);
      setEntries(
        ((data ?? []) as Entry[]).map((row) => ({
          ...row,
          credits: Number(row.credits),
          cost_usd: Number(row.cost_usd),
        }))
      );
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
        <DataGrid<Entry> rows={entries} columns={columns} getRowId={(row) => row.id} heightClass="h-80" pageSize={20} />
      )}
    </section>
  );
}
