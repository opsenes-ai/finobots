"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatDate, formatMoney } from "@/lib/utils";
import { forecastResource } from "./overview";

// The balance 30 days out, if the last 90 days' average carries on.
export function CashflowForecast({ className }: { className?: string }) {
  const forecast = forecastResource.use();
  const end = forecast?.points.at(-1);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Forecast</CardTitle>
        <CardDescription>Based on your average daily net over 90 days.</CardDescription>
      </CardHeader>
      <CardContent>
        {forecast === undefined ? (
          <p className="text-muted-foreground text-sm">Loading…</p>
        ) : !forecast || !end ? (
          <p className="text-muted-foreground text-sm">Not enough data to forecast yet.</p>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-muted-foreground text-xs">In {forecast.horizon_days} days</p>
              <p className={cn("text-2xl font-semibold tabular-nums", end.balance < 0 && "text-destructive")}>
                {formatMoney(end.balance, forecast.currency)}
              </p>
              <p className="text-muted-foreground text-xs">
                From {formatMoney(forecast.current_balance, forecast.currency)} today ·{" "}
                {forecast.average_daily_net >= 0 ? "+" : ""}
                {formatMoney(forecast.average_daily_net, forecast.currency)} a day
              </p>
            </div>
            <ul className="space-y-1.5 text-sm">
              {forecast.points.map((point) => (
                <li key={point.date} className="flex justify-between gap-2">
                  <span className="text-muted-foreground">{formatDate(point.date)}</span>
                  <span className={cn("tabular-nums", point.balance < 0 && "text-destructive")}>
                    {formatMoney(point.balance, forecast.currency)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
