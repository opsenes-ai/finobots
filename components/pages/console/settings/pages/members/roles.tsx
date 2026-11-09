import { Skeleton } from "@/components/ui/skeleton";

// Owner, admin, and member permissions.
export function MembersRoles() {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-medium">Roles</h3>
      <div className="grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2 rounded-lg border p-3">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        ))}
      </div>
    </section>
  );
}
