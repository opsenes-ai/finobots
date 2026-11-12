"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatMoney } from "@/lib/utils";
import { accountsResource } from "./listing";
import { totalsByCurrency } from "./overview";

// Balance per currency, with each account's share of it.
export function AccountsBalances({ className }: { className?: string }) {
  const data = accountsResource.use();
  const items = data?.items ?? [];
  const totals = totalsByCurrency(items);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Balances</CardTitle>
      </CardHeader>
      <CardContent>
        {data === undefined ? (
          <p className="text-muted-foreground text-sm">Loading…</p>
        ) : totals.length === 0 ? (
          <p className="text-muted-foreground text-sm">No balances yet.</p>
        ) : (
          <div className="space-y-5">
            {totals.map(({ currency, total }) => {
              const accounts = items.filter((item) => item.is_active && item.currency === currency);
              const positive = accounts.reduce((sum, item) => sum + Math.max(item.balance, 0), 0);
              return (
                <div key={currency} className="space-y-2">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-medium">{currency}</span>
                    <span className={cn("text-sm font-semibold tabular-nums", total < 0 && "text-destructive")}>
                      {formatMoney(total, currency)}
                    </span>
                  </div>
                  <ul className="space-y-1.5">
                    {accounts.map((item) => (
                      <li key={item.id} className="space-y-1">
                        <div className="text-muted-foreground flex justify-between gap-2 text-xs">
                          <span className="truncate">{item.name}</span>
                          <span className="tabular-nums">{formatMoney(item.balance, currency)}</span>
                        </div>
                        <div className="bg-muted h-1.5 overflow-hidden rounded-full">
                          <div
                            className="bg-primary h-full rounded-full"
                            style={{
                              width: `${positive > 0 ? (Math.max(item.balance, 0) / positive) * 100 : 0}%`,
                            }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
