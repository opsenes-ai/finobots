import { Skeleton } from "@/components/ui/skeleton";

// Permissions granted to each key.
export function ApiScopes() {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-medium">Scopes</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="size-4 shrink-0" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>
    </section>
  );
}
