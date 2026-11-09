import { Skeleton } from "@/components/ui/skeleton";

// Delete account data.
export function DataDeletion() {
  return (
    <section className="space-y-3 rounded-lg border border-destructive/30 p-4">
      <h3 className="text-sm font-medium text-destructive">Deletion</h3>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-8 w-32" />
    </section>
  );
}
