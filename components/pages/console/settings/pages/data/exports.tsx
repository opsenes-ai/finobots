import { Skeleton } from "@/components/ui/skeleton";

// Export data as CSV or JSON.
export function DataExports() {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-medium">Exports</h3>
      <div className="flex gap-2">
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-8 w-28" />
      </div>
    </section>
  );
}
