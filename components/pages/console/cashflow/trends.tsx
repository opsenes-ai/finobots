"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn, formatMoney } from "@/lib/utils";
import { monthLabel } from "./canvas";
import { useCashflow } from "./overview";

// Month by month, with the change in net from the month before.
export function CashflowTrends({ className }: { className?: string }) {
  const { data, summary } = useCashflow();
  const months = summary?.months ?? [];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Trends</CardTitle>
      </CardHeader>
      <CardContent>
        {data === undefined ? (
          <p className="text-muted-foreground text-sm">Loading…</p>
        ) : months.length === 0 || !summary ? (
          <p className="text-muted-foreground text-sm">No months to compare yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead className="text-right">In</TableHead>
                <TableHead className="text-right">Out</TableHead>
                <TableHead className="text-right">Net</TableHead>
                <TableHead className="text-right">Change</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {months.map((month, i) => {
                const change = i > 0 ? month.net - months[i - 1].net : null;
                return (
                  <TableRow key={month.month}>
                    <TableCell>{monthLabel(month.month)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatMoney(month.inflow, summary.currency)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatMoney(month.outflow, summary.currency)}</TableCell>
                    <TableCell className={cn("text-right tabular-nums", month.net < 0 && "text-destructive")}>
                      {formatMoney(month.net, summary.currency)}
                    </TableCell>
                    <TableCell className={cn("text-right tabular-nums", change !== null && change < 0 && "text-destructive")}>
                      {change === null ? "–" : `${change > 0 ? "+" : ""}${formatMoney(change, summary.currency)}`}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
