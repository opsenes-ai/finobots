"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { currencyStore, forecastResource, rangeStore, summaryResource } from "./overview";

const RANGES = [
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
  { value: "180", label: "Last 6 months" },
  { value: "365", label: "Last year" },
];

// Date range and currency.
export function CashflowControls() {
  const range = rangeStore.use();
  const chosen = currencyStore.use();
  const data = summaryResource.use();
  const currencies = (data?.currencies ?? []).map((item) => ({ value: item.currency, label: item.currency }));
  const currency = chosen || currencies[0]?.value || "";

  return (
    <div className="flex flex-wrap gap-2">
      <Select
        items={RANGES}
        value={range}
        onValueChange={(value) => {
          rangeStore.set(String(value));
          void summaryResource.reload();
        }}
      >
        <SelectTrigger aria-label="Date range" className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {RANGES.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {currencies.length > 1 ? (
        <Select
          items={currencies}
          value={currency}
          onValueChange={(value) => {
            currencyStore.set(String(value));
            void forecastResource.reload();
          }}
        >
          <SelectTrigger aria-label="Currency" className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {currencies.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}
    </div>
  );
}
