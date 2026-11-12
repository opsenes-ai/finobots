"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createClient, getWorkspaceId } from "@/lib/client";

const COLUMNS = [
  "occurred_at",
  "external_id",
  "amount",
  "currency",
  "status",
  "description",
  "counterparty",
  "category",
] as const;

type Row = Record<(typeof COLUMNS)[number], string | number | null>;

// Spreadsheet apps run text starting with these as a formula, so defuse it.
function csvCell(value: string | number | null) {
  let text = value === null ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(text) && typeof value === "string") text = `'${text}`;
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function download(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

// Download transactions as CSV or JSON.
export function DataExports() {
  const [busy, setBusy] = useState<"csv" | "json" | null>(null);

  async function run(format: "csv" | "json") {
    setBusy(format);
    try {
      const organizationId = await getWorkspaceId();
      if (!organizationId) throw new Error("No workspace");

      const { data, error } = await createClient()
        .from("transactions")
        .select(COLUMNS.join(", "))
        .eq("organization_id", organizationId)
        .order("occurred_at", { ascending: false })
        .limit(10000)
        .overrideTypes<Row[]>();
      if (error) throw error;

      const rows = data ?? [];
      if (rows.length === 0) {
        toast.info("No transactions to export yet.");
        return;
      }

      const stamp = new Date().toISOString().slice(0, 10);
      if (format === "json") {
        download(`transactions-${stamp}.json`, JSON.stringify(rows, null, 2), "application/json");
      } else {
        const lines = [COLUMNS.join(","), ...rows.map((row) => COLUMNS.map((c) => csvCell(row[c])).join(","))];
        download(`transactions-${stamp}.csv`, lines.join("\n"), "text/csv");
      }
    } catch {
      toast.error("Couldn't export. Try again.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-medium">Exports</h3>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={busy !== null} onClick={() => run("csv")}>
          {busy === "csv" ? "Preparing…" : "Download CSV"}
        </Button>
        <Button variant="outline" size="sm" disabled={busy !== null} onClick={() => run("json")}>
          {busy === "json" ? "Preparing…" : "Download JSON"}
        </Button>
      </div>
    </section>
  );
}
