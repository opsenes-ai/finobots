import { Skeleton } from "@/components/ui/skeleton";

// Default currency and number format.
export function GeneralCurrency() {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-medium">Currency</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-8 w-full" />
          </div>
        ))}
      </div>
    </section>
  );
}
