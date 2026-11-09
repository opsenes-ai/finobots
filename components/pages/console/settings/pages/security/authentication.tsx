import { Skeleton } from "@/components/ui/skeleton";

// Two-factor authentication.
export function SecurityAuthentication() {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-medium">Authentication</h3>
      <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
        <div className="space-y-2">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-3 w-56 max-w-full" />
        </div>
        <Skeleton className="h-8 w-20 shrink-0" />
      </div>
    </section>
  );
}
