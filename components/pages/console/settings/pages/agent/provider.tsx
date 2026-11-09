import { Skeleton } from "@/components/ui/skeleton";

// AI provider selection.
export function AgentProvider() {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-medium">Provider</h3>
      <div className="grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-lg border p-3">
            <Skeleton className="size-8 shrink-0 rounded-md" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    </section>
  );
}
