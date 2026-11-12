"use client";

import { useEffect, useState } from "react";
import type { ColDef } from "ag-grid-community";
import { DataGrid } from "@/components/shared/console/data-grid";
import { createClient } from "@/lib/client";
import { formatDate } from "@/lib/utils";

type Row = { id: string; day: string; key: string; requests: number };

const columns: ColDef<Row>[] = [
  { field: "day", headerName: "Day", sort: "desc", width: 140, valueFormatter: (p) => formatDate(p.value) },
  { field: "key", headerName: "Key", flex: 1, minWidth: 150 },
  {
    field: "requests",
    headerName: "Requests",
    type: "rightAligned",
    width: 120,
    filter: "agNumberColumnFilter",
    valueFormatter: (p) => Number(p.value).toLocaleString(),
  },
];

// Daily requests per key over the last 30 days.
export function ApiUsage() {
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    async function load() {
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const { data } = await createClient()
        .from("api_key_usage")
        .select("api_key_id, day, requests, key:api_keys(name)")
        .gte("day", since)
        .order("day", { ascending: false });
      const list = (data ?? []) as unknown as {
        api_key_id: string;
        day: string;
        requests: number;
        key: { name: string } | null;
      }[];
      setRows(
        list.map((row) => ({
          id: `${row.api_key_id}:${row.day}`,
          day: row.day,
          key: row.key?.name ?? "Revoked key",
          requests: row.requests,
        }))
      );
    }
    void load();
  }, []);

  const total = rows?.reduce((sum, row) => sum + row.requests, 0) ?? 0;

  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-medium">Usage</h3>
        {rows ? (
          <span className="text-muted-foreground text-sm tabular-nums">
            {total.toLocaleString()} requests in 30 days
          </span>
        ) : null}
      </div>
      {rows === null ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-muted-foreground rounded-lg border border-dashed p-4 text-center text-sm">
          No requests yet.
        </p>
      ) : (
        <DataGrid<Row> rows={rows} columns={columns} getRowId={(row) => row.id} heightClass="h-72" pageSize={15} />
      )}
    </section>
  );
}
