import { Skeleton } from "@/components/ui/skeleton";

// Sync, reconnect, and disconnect.
export function ConnectionActions() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-8 w-28" />
      <Skeleton className="h-8 w-28" />
    </div>
  );
}
