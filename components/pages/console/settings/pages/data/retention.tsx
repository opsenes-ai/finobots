import { Skeleton } from "@/components/ui/skeleton";

// How long data is kept.
export function DataRetention() {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-medium">Retention</h3>
      <div className="space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-full sm:w-64" />
      </div>
    </section>
  );
}
