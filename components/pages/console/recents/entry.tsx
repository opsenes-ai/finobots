import { Skeleton } from "@/components/ui/skeleton";
import { RecentActions } from "./actions";

// Chat title, preview, and timestamp.
export function RecentEntry() {
  return (
    <div className="flex items-center gap-4 rounded-lg border bg-card p-4">
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="h-4 w-48 max-w-full" />
          <Skeleton className="h-3 w-12 shrink-0" />
        </div>
        <Skeleton className="h-3 w-full" />
      </div>
      <RecentActions />
    </div>
  );
}
