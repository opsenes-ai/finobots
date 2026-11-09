import { Skeleton } from "@/components/ui/skeleton";

// Summary email frequency.
export function NotificationsDigest() {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-medium">Digest</h3>
      <div className="flex gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-20" />
        ))}
      </div>
    </section>
  );
}
