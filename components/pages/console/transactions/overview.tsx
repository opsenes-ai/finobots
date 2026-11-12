"use client";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney } from "@/lib/utils";
import { transactionsResource } from "./ledger";

// Headline numbers for the filtered transactions. Only completed ones count
// towards money in and out, in the most used currency.
export function TransactionsOverview() {
  const data = transactionsResource.use();
  const items = data?.items ?? [];

  const counts = new Map<string, number>();
  for (const item of items) counts.set(item.currency, (counts.get(item.currency) ?? 0) + 1);
  const currency = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];

  const completed = items.filter((item) => item.status === "completed" && item.currency === currency);
  const moneyIn = completed.filter((item) => item.amount > 0).reduce((sum, item) => sum + item.amount, 0);
  const moneyOut = completed.filter((item) => item.amount < 0).reduce((sum, item) => sum - item.amount, 0);
  const uncategorised = items.filter((item) => !item.category).length;

  const money = (value: number) => (data && currency ? formatMoney(value, currency) : "–");

  const stats = [
    { label: "Transactions", value: data ? items.length.toLocaleString() : "–" },
    { label: currency ? `Money in (${currency})` : "Money in", value: money(moneyIn) },
    { label: currency ? `Money out (${currency})` : "Money out", value: money(moneyOut) },
    { label: "Uncategorised", value: data ? uncategorised.toLocaleString() : "–" },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label} size="sm">
          <CardHeader>
            <CardDescription>{stat.label}</CardDescription>
            <CardTitle className="text-2xl tabular-nums">{stat.value}</CardTitle>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
