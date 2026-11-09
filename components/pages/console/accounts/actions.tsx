import { Skeleton } from "@/components/ui/skeleton";

// Page-level actions, such as adding or syncing accounts.
export function AccountsActions() {
  return (
    <div className="flex items-center gap-2">
      <Skeleton className="h-8 w-24" />
      <Skeleton className="h-8 w-28" />
    </div>
  );
}
