"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney } from "@/lib/utils";
import { useCashflow } from "./overview";

// Where money goes: spending by category.
export function CashflowBreakdown({ className }: { className?: string }) {
  const { data, summary } = useCashflow();
  const spending = (summary?.categories ?? [])
    .filter((item) => item.outflow > 0)
    .sort((a, b) => b.outflow - a.outflow)
    .slice(0, 6);
  const total = spending.reduce((sum, item) => sum + item.outflow, 0);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Spending</CardTitle>
      </CardHeader>
      <CardContent>
        {data === undefined ? (
          <p className="text-muted-foreground text-sm">Loading…</p>
        ) : spending.length === 0 || !summary ? (
          <p className="text-muted-foreground text-sm">No money out yet.</p>
        ) : (
          <ul className="space-y-3">
            {spending.map((item) => (
              <li key={item.category} className="space-y-1">
                <div className="flex justify-between gap-2 text-sm">
                  <span className="truncate">{item.category}</span>
                  <span className="tabular-nums">
                    {formatMoney(item.outflow, summary.currency)}
                    <span className="text-muted-foreground ml-1 text-xs">
                      {Math.round((item.outflow / total) * 100)}%
                    </span>
                  </span>
                </div>
                <div className="bg-muted h-1.5 overflow-hidden rounded-full">
                  <div
                    className="bg-muted-foreground/60 h-full rounded-full"
                    style={{ width: `${(item.outflow / total) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
