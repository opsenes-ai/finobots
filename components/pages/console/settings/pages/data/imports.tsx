import { Skeleton } from "@/components/ui/skeleton";

// Import transactions and records from files.
export function DataImports() {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-medium">Imports</h3>
      <Skeleton className="h-24 w-full" />
    </section>
  );
}
