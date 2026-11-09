import { Skeleton } from "@/components/ui/skeleton";

// Email and in-app delivery.
export function NotificationsChannels() {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-medium">Channels</h3>
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between gap-4">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-5 w-9 shrink-0 rounded-full" />
        </div>
      ))}
    </section>
  );
}
