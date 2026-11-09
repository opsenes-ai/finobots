import { Skeleton } from "@/components/ui/skeleton";

// Period, accounts, and currency filters.
export function CashflowControls() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Skeleton className="h-8 w-28" />
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-8 w-20" />
    </div>
  );
}
