import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// Transaction table. Skeleton rows stand in until AG Grid is added.
export function TransactionsLedger({ className }: { className?: string }) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Ledger</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <div className="grid grid-cols-[1fr_2fr_1fr_1fr] gap-4 border-b pb-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-16" />
          ))}
        </div>
        {Array.from({ length: 8 }).map((_, row) => (
          <div
            key={row}
            className="grid grid-cols-[1fr_2fr_1fr_1fr] items-center gap-4 border-b py-3 last:border-b-0"
          >
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="ml-auto h-4 w-16" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
