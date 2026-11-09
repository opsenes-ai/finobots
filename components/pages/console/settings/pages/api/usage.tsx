import { Skeleton } from "@/components/ui/skeleton";

// Request counts and limits.
export function ApiUsage() {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-medium">Usage</h3>
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>
      <Skeleton className="h-2 w-full rounded-full" />
    </section>
  );
}
