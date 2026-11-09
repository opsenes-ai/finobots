import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const barHeights = ["h-16", "h-24", "h-20", "h-32", "h-28", "h-36", "h-24", "h-40"];

// Cashflow over time.
export function CashflowTrends({ className }: { className?: string }) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Trends</CardTitle>
      </CardHeader>
      <CardContent className="flex h-44 items-end gap-2">
        {barHeights.map((height, i) => (
          <Skeleton key={i} className={`${height} flex-1`} />
        ))}
      </CardContent>
    </Card>
  );
}
