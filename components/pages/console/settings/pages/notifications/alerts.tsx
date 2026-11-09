import { Skeleton } from "@/components/ui/skeleton";

// Alerts for payments, invoices, and approvals.
export function NotificationsAlerts() {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-medium">Alerts</h3>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-3 w-36" />
            <Skeleton className="h-3 w-48 max-w-full" />
          </div>
          <Skeleton className="h-5 w-9 shrink-0 rounded-full" />
        </div>
      ))}
    </section>
  );
}
