"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney } from "@/lib/utils";
import { useCashflow } from "./overview";

// Where money comes from: the biggest income categories.
export function CashflowStreams({ className }: { className?: string }) {
  const { data, summary } = useCashflow();
  const streams = (summary?.categories ?? [])
    .filter((item) => item.inflow > 0)
    .sort((a, b) => b.inflow - a.inflow)
    .slice(0, 5);
  const total = streams.reduce((sum, item) => sum + item.inflow, 0);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Income streams</CardTitle>
      </CardHeader>
      <CardContent>
        {data === undefined ? (
          <p className="text-muted-foreground text-sm">Loading…</p>
        ) : streams.length === 0 || !summary ? (
          <p className="text-muted-foreground text-sm">No money in yet.</p>
        ) : (
          <ul className="space-y-3">
            {streams.map((item) => (
              <li key={item.category} className="space-y-1">
                <div className="flex justify-between gap-2 text-sm">
                  <span className="truncate">{item.category}</span>
                  <span className="tabular-nums">{formatMoney(item.inflow, summary.currency)}</span>
                </div>
                <div className="bg-muted h-1.5 overflow-hidden rounded-full">
                  <div className="bg-primary h-full rounded-full" style={{ width: `${(item.inflow / total) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
