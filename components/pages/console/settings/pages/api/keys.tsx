import { Skeleton } from "@/components/ui/skeleton";

// API keys.
export function ApiKeys() {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Keys</h3>
        <Skeleton className="h-8 w-24" />
      </div>
      <div className="divide-y rounded-lg border">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-4 p-3">
            <div className="space-y-2">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-3 w-40" />
            </div>
            <Skeleton className="size-7 shrink-0" />
          </div>
        ))}
      </div>
    </section>
  );
}
