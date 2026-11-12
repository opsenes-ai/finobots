import { Skeleton } from "@/components/ui/skeleton";

// Saved preferences and context.
export function PersonalisationMemory() {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-medium">Memory</h3>
      <div className="divide-y rounded-lg border">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-4 p-3">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="size-7 shrink-0" />
          </div>
        ))}
      </div>
    </section>
  );
}
