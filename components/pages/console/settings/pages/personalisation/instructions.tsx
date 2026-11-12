import { Skeleton } from "@/components/ui/skeleton";

// Custom agent instructions.
export function PersonalisationInstructions() {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-medium">Instructions</h3>
      <Skeleton className="h-28 w-full" />
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-8 w-20" />
      </div>
    </section>
  );
}
