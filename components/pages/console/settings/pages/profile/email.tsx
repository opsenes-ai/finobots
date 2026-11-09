import { Skeleton } from "@/components/ui/skeleton";

// Email address and verification.
export function ProfileEmail() {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-medium">Email</h3>
      <div className="flex items-end gap-2">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-8 w-full" />
        </div>
        <Skeleton className="h-8 w-20" />
      </div>
    </section>
  );
}
