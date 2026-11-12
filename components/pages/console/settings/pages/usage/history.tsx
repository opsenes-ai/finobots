import { Skeleton } from "@/components/ui/skeleton";

const columns = "grid-cols-[1.5fr_1fr_1fr_1fr]";

// Request-level usage records.
export function UsageHistory() {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-medium">History</h3>
      <div className="divide-y rounded-lg border">
        <div className={`grid ${columns} gap-4 p-3`}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-16" />
          ))}
        </div>
        {Array.from({ length: 5 }).map((_, row) => (
          <div key={row} className={`grid ${columns} items-center gap-4 p-3`}>
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-14" />
            <Skeleton className="h-3 w-12" />
          </div>
        ))}
      </div>
    </section>
  );
}
