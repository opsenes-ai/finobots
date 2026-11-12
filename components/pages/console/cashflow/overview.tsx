"use client";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { callFunction, createResource, createStore, getWorkspaceId } from "@/lib/client";
import { cn, formatMoney } from "@/lib/utils";

type Totals = { inflow: number; outflow: number; net: number };

export type CurrencySummary = Totals & {
  currency: string;
  categories: (Totals & { category: string })[];
  months: (Totals & { month: string })[];
};

export type Forecast = {
  currency: string;
  current_balance: number;
  average_daily_net: number;
  horizon_days: number;
  points: { date: string; balance: number }[];
};

// Days to look back. Up to a year, the most the summary allows.
export const rangeStore = createStore("90");

// The currency shown. Empty means the most active one.
export const currencyStore = createStore("");

// Inflow, outflow and net per currency for the chosen range (completed only).
export const summaryResource = createResource(async () => {
  const organizationId = await getWorkspaceId();
  if (!organizationId) return { organizationId: null, currencies: [] as CurrencySummary[], error: null };
  const to = new Date();
  const from = new Date(to.getTime() - Number(rangeStore.get()) * 86_400_000);
  const { data, error } = await callFunction<{ currencies: CurrencySummary[] }>("cashflow", {
    action: "summary",
    organization_id: organizationId,
    from: from.toISOString(),
    to: to.toISOString(),
  });
  const currencies = (data?.currencies ?? []).sort(
    (a, b) => b.inflow + b.outflow - (a.inflow + a.outflow)
  );
  return { organizationId, currencies, error };
});

/** The summary for the chosen currency, or the most active one. */
export function useCashflow() {
  const data = summaryResource.use();
  const chosen = currencyStore.use();
  const summary = data?.currencies.find((item) => item.currency === chosen) ?? data?.currencies[0] ?? null;
  return { data, summary };
}

// Projected balance from the average daily net over the last 90 days.
export const forecastResource = createResource(async () => {
  const organizationId = await getWorkspaceId();
  if (!summaryResource.get()) await summaryResource.reload();
  const summary = summaryResource.get();
  const currency = currencyStore.get() || summary?.currencies[0]?.currency;
  if (!organizationId || !currency) return null;
  const { data } = await callFunction<Forecast>("cashflow", {
    action: "forecast",
    organization_id: organizationId,
    currency,
    lookback_days: 90,
    horizon_days: 30,
  });
  return data;
});

// Money in, money out and net.
export function CashflowOverview() {
  const { data, summary } = useCashflow();
  const money = (value: number | undefined) =>
    summary && value !== undefined ? formatMoney(value, summary.currency) : "–";

  const stats = [
    { label: "Money in", value: money(summary?.inflow), tone: "" },
    { label: "Money out", value: money(summary?.outflow), tone: "" },
    { label: "Net", value: money(summary?.net), tone: (summary?.net ?? 0) < 0 ? "text-destructive" : "" },
  ];

  return (
    <div className="space-y-2">
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label} size="sm">
            <CardHeader>
              <CardDescription>
                {stat.label}
                {summary ? ` (${summary.currency})` : ""}
              </CardDescription>
              <CardTitle className={cn("text-2xl tabular-nums", stat.tone)}>{data ? stat.value : "–"}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>
      {data?.error ? <p className="text-destructive text-sm">{data.error}</p> : null}
      {data && !data.error && data.currencies.length === 0 ? (
        <p className="text-muted-foreground text-sm">No completed transactions in this range.</p>
      ) : null}
    </div>
  );
}
