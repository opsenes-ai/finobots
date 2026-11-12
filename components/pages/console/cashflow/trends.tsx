"use client";

import { useMemo } from "react";
import type { ColDef } from "ag-grid-community";
import { DataGrid } from "@/components/shared/console/data-grid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney } from "@/lib/utils";
import { monthLabel } from "./canvas";
import { useCashflow } from "./overview";

type Row = { month: string; inflow: number; outflow: number; net: number; change: number | null };

const negative = (p: { value?: number | null }) => ((p.value ?? 0) < 0 ? "text-destructive tabular-nums" : "tabular-nums");

// Month by month, with the change in net from the month before and a totals row.
export function CashflowTrends({ className }: { className?: string }) {
  const { data, summary } = useCashflow();
  const currency = summary?.currency ?? "USD";

  const rows = useMemo<Row[]>(
    () =>
      (summary?.months ?? []).map((month, i, all) => ({
        ...month,
        change: i > 0 ? month.net - all[i - 1].net : null,
      })),
    [summary]
  );

  const totals = useMemo<Row[]>(
    () =>
      rows.length
        ? [{
            month: "Total",
            inflow: rows.reduce((sum, row) => sum + row.inflow, 0),
            outflow: rows.reduce((sum, row) => sum + row.outflow, 0),
            net: rows.reduce((sum, row) => sum + row.net, 0),
            change: null,
          }]
        : [],
    [rows]
  );

  const columns = useMemo<ColDef<Row>[]>(
    () => [
      {
        field: "month",
        headerName: "Month",
        sort: "asc",
        flex: 1,
        minWidth: 110,
        valueFormatter: (p) => (p.value === "Total" ? "Total" : monthLabel(p.value)),
        cellClass: (p) => (p.node.rowPinned ? "font-semibold" : ""),
      },
      { field: "inflow", headerName: "In", type: "rightAligned", flex: 1, valueFormatter: (p) => formatMoney(p.value, currency), cellClass: "tabular-nums" },
      { field: "outflow", headerName: "Out", type: "rightAligned", flex: 1, valueFormatter: (p) => formatMoney(p.value, currency), cellClass: "tabular-nums" },
      { field: "net", headerName: "Net", type: "rightAligned", flex: 1, valueFormatter: (p) => formatMoney(p.value, currency), cellClass: negative },
      {
        field: "change",
        headerName: "Change",
        type: "rightAligned",
        flex: 1,
        valueFormatter: (p) =>
          p.value === null || p.value === undefined ? "–" : `${p.value > 0 ? "+" : ""}${formatMoney(p.value, currency)}`,
        cellClass: negative,
      },
    ],
    [currency]
  );

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Trends</CardTitle>
      </CardHeader>
      <CardContent>
        {data === undefined ? (
          <p className="text-muted-foreground text-sm">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-muted-foreground text-sm">No months to compare yet.</p>
        ) : (
          <DataGrid<Row>
            rows={rows}
            columns={columns}
            getRowId={(row) => row.month}
            pinnedBottom={totals}
            heightClass="h-80"
          />
        )}
      </CardContent>
    </Card>
  );
}
