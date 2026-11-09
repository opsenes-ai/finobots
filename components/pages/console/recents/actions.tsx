import { Skeleton } from "@/components/ui/skeleton";

// Rename, archive, and delete.
export function RecentActions() {
  return (
    <div className="flex shrink-0 items-center gap-1">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="size-7" />
      ))}
    </div>
  );
}
