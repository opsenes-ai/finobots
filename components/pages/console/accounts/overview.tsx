"use client";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatMoney } from "@/lib/utils";
import { accountsResource, type Account } from "./listing";

/** Active balances added up per currency, largest first. Currencies are never mixed. */
export function totalsByCurrency(items: Account[]) {
  const totals = new Map<string, { total: number; count: number }>();
  for (const item of items) {
    if (!item.is_active) continue;
    const entry = totals.get(item.currency) ?? { total: 0, count: 0 };
    entry.total += item.balance;
    entry.count += 1;
    totals.set(item.currency, entry);
  }
  return [...totals.entries()]
    .map(([currency, entry]) => ({ currency, ...entry }))
    .sort((a, b) => Math.abs(b.total) - Math.abs(a.total));
}

// Headline numbers.
export function AccountsOverview() {
  const data = accountsResource.use();
  const items = data?.items ?? [];
  const active = items.filter((item) => item.is_active);
  const totals = totalsByCurrency(items);
  const lastUpdated = active
    .map((item) => item.balance_updated_at)
    .filter((value): value is string => Boolean(value))
    .sort()
    .at(-1);

  const stats = [
    {
      label: "Total balance",
      value: totals[0] ? formatMoney(totals[0].total, totals[0].currency) : "–",
      note: totals.length > 1 ? `+ ${totals.length - 1} other currenc${totals.length === 2 ? "y" : "ies"}` : null,
    },
    { label: "Active accounts", value: data ? String(active.length) : "–", note: null },
    { label: "Currencies", value: data ? String(totals.length) : "–", note: null },
    { label: "Last updated", value: lastUpdated ? formatDate(lastUpdated) : "–", note: null },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label} size="sm">
          <CardHeader>
            <CardDescription>{stat.label}</CardDescription>
            <CardTitle className="text-2xl tabular-nums">{stat.value}</CardTitle>
            {stat.note ? <p className="text-muted-foreground text-xs">{stat.note}</p> : null}
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
