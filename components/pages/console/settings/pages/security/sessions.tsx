import { Skeleton } from "@/components/ui/skeleton";

// Active sessions and devices.
export function SecuritySessions() {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-medium">Sessions</h3>
      <div className="divide-y rounded-lg border">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-4 p-3">
            <div className="flex items-center gap-3">
              <Skeleton className="size-8 shrink-0 rounded-md" />
              <div className="space-y-2">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-7 w-16 shrink-0" />
          </div>
        ))}
      </div>
    </section>
  );
}
