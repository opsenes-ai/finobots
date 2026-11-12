import { Skeleton } from "@/components/ui/skeleton";

const stats = ["Tokens", "Requests", "Estimated cost"];

// Tokens, requests, and estimated costs.
export function UsageSummary() {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-medium">Summary</h3>
      <div className="grid gap-3 sm:grid-cols-3">
        {stats.map((label) => (
          <div key={label} className="space-y-2 rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">{label}</p>
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
    </section>
  );
}
