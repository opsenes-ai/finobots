"use client";

import { useEffect, useState } from "react";
import type { ColDef } from "ag-grid-community";
import { DataGrid } from "@/components/ui/data-grid";
import { createClient, getWorkspaceId } from "@/lib/client";
import { formatDate } from "@/lib/utils";

type Job = {
  id: string;
  kind: "import" | "export";
  status: "pending" | "processing" | "completed" | "failed";
  format: string;
  row_count: number | null;
  error: string | null;
  created_at: string;
  completed_at: string | null;
};

const capitalise = (value?: string | null) => (value ? value.charAt(0).toUpperCase() + value.slice(1) : "");

const columns: ColDef<Job>[] = [
  { field: "created_at", headerName: "Started", sort: "desc", width: 170, valueFormatter: (p) => formatDate(p.value, true) },
  { field: "kind", headerName: "Type", width: 100, valueFormatter: (p) => capitalise(p.value) },
  { field: "format", headerName: "Format", width: 95, valueFormatter: (p) => (p.value ?? "").toUpperCase() },
  {
    field: "status",
    headerName: "Status",
    width: 120,
    valueFormatter: (p) => capitalise(p.value),
    cellClass: (p) => (p.value === "failed" ? "text-destructive" : ""),
  },
  {
    field: "row_count",
    headerName: "Rows",
    type: "rightAligned",
    width: 90,
    valueFormatter: (p) => (p.value === null || p.value === undefined ? "–" : Number(p.value).toLocaleString()),
  },
  { field: "error", headerName: "Details", flex: 1, minWidth: 160, valueFormatter: (p) => p.value ?? "–", tooltipField: "error" },
];

// Past imports and exports.
export function DataJobs() {
  const [jobs, setJobs] = useState<Job[] | null>(null);

  useEffect(() => {
    async function load() {
      const organizationId = await getWorkspaceId();
      if (!organizationId) {
        setJobs([]);
        return;
      }
      const { data } = await createClient()
        .from("data_jobs")
        .select("id, kind, status, format, row_count, error, created_at, completed_at")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false })
        .limit(200);
      setJobs((data as Job[] | null) ?? []);
    }
    void load();
  }, []);

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-medium">History</h3>
      {jobs === null ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : jobs.length === 0 ? (
        <p className="text-muted-foreground rounded-lg border border-dashed p-4 text-center text-sm">
          No imports or exports yet.
        </p>
      ) : (
        <DataGrid<Job> rows={jobs} columns={columns} getRowId={(row) => row.id} heightClass="h-64" pageSize={10} />
      )}
    </section>
  );
}
