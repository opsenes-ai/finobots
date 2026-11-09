import { Skeleton } from "@/components/ui/skeleton";

// Organization name and logo.
export function GeneralIdentity() {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-medium">Identity</h3>
      <div className="flex items-center gap-4">
        <Skeleton className="size-12 shrink-0 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-full" />
        </div>
      </div>
    </section>
  );
}
