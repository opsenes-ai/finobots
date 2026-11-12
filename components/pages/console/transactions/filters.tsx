"use client";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { filtersStore, STATUSES, transactionsResource, type Filters } from "./ledger";

const RANGES = [
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
  { value: "365", label: "Last year" },
  { value: "all", label: "All time" },
];

function FilterSelect({
  label,
  value,
  items,
  onChange,
}: {
  label: string;
  value: string;
  items: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <Select items={items} value={value} onValueChange={(next) => onChange(String(next))}>
      <SelectTrigger aria-label={label} className="w-40">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// Search, date range, status and account filters.
export function TransactionsFilters() {
  const filters = filtersStore.use();
  const data = transactionsResource.use();
  const accounts = [{ value: "all", label: "All accounts" }, ...(data?.accounts ?? []).map((a) => ({ value: a.id, label: a.name }))];

  // Search filters the loaded rows; the others fetch again.
  function update(change: Partial<Filters>, refetch: boolean) {
    filtersStore.set({ ...filtersStore.get(), ...change });
    if (refetch) void transactionsResource.reload();
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Input
        type="search"
        aria-label="Search transactions"
        placeholder="Search"
        className="w-48"
        value={filters.search}
        onChange={(event) => update({ search: event.target.value }, false)}
      />
      <FilterSelect label="Date range" value={filters.days} items={RANGES} onChange={(days) => update({ days }, true)} />
      <FilterSelect
        label="Status"
        value={filters.status}
        items={STATUSES}
        onChange={(status) => update({ status: status as Filters["status"] }, true)}
      />
      <FilterSelect
        label="Account"
        value={filters.accountId}
        items={accounts}
        onChange={(accountId) => update({ accountId }, true)}
      />
    </div>
  );
}
