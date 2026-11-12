"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney } from "@/lib/utils";
import { useCashflow } from "./overview";

export function monthLabel(month: string) {
  const [year, value] = month.split("-").map(Number);
  return new Date(Date.UTC(year, value - 1, 1)).toLocaleDateString(undefined, {
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  });
}

// Money in and out per month, as paired bars.
export function CashflowCanvas({ className }: { className?: string }) {
  const { data, summary } = useCashflow();
  const months = summary?.months ?? [];
  const peak = Math.max(1, ...months.flatMap((month) => [month.inflow, month.outflow]));

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Monthly cash flow</CardTitle>
      </CardHeader>
      <CardContent>
        {data === undefined ? (
          <p className="text-muted-foreground text-sm">Loading…</p>
        ) : !summary || months.length === 0 ? (
          <p className="text-muted-foreground rounded-lg border border-dashed p-6 text-center text-sm">
            Nothing to chart yet. Import transactions from a PayPal connection.
          </p>
        ) : (
          <figure className="space-y-3">
            <div className="flex h-64 items-end gap-3 border-b" role="img" aria-label="Money in and out by month">
              {months.map((month) => (
                <div key={month.month} className="flex h-full min-w-0 flex-1 flex-col justify-end gap-1">
                  <div className="flex h-full items-end justify-center gap-1">
                    <div
                      className="bg-primary w-1/3 max-w-6 rounded-t"
                      style={{ height: `${(month.inflow / peak) * 100}%` }}
                      title={`In: ${formatMoney(month.inflow, summary.currency)}`}
                    />
                    <div
                      className="bg-muted-foreground/40 w-1/3 max-w-6 rounded-t"
                      style={{ height: `${(month.outflow / peak) * 100}%` }}
                      title={`Out: ${formatMoney(month.outflow, summary.currency)}`}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              {months.map((month) => (
                <span key={month.month} className="text-muted-foreground min-w-0 flex-1 truncate text-center text-xs">
                  {monthLabel(month.month)}
                </span>
              ))}
            </div>
            <figcaption className="text-muted-foreground flex gap-4 text-xs">
              <span className="flex items-center gap-1.5">
                <span aria-hidden className="bg-primary size-2.5 rounded-sm" /> Money in
              </span>
              <span className="flex items-center gap-1.5">
                <span aria-hidden className="bg-muted-foreground/40 size-2.5 rounded-sm" /> Money out
              </span>
            </figcaption>
          </figure>
        )}
      </CardContent>
    </Card>
  );
}
