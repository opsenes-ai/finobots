import { Skeleton } from "@/components/ui/skeleton";

// Which agent actions need approval.
export function AgentApprovals() {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-medium">Approvals</h3>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-3 w-36" />
            <Skeleton className="h-3 w-52 max-w-full" />
          </div>
          <Skeleton className="h-5 w-9 shrink-0 rounded-full" />
        </div>
      ))}
    </section>
  );
}
