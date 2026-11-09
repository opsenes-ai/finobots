import { Skeleton } from "@/components/ui/skeleton";

// Account, date, status, and category filters.
export function TransactionsFilters() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Skeleton className="h-8 w-28" />
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-8 w-24" />
      <Skeleton className="h-8 w-28" />
    </div>
  );
}
