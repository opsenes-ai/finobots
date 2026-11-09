import { Skeleton } from "@/components/ui/skeleton";

// Change password.
export function SecurityPassword() {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-medium">Password</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-8 w-full" />
          </div>
        ))}
      </div>
      <Skeleton className="h-8 w-32" />
    </section>
  );
}
