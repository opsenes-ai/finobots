import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const totals = ["Inflow", "Outflow", "Net"];

// Inflow, outflow, and net totals.
export function CashflowOverview() {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {totals.map((label) => (
        <Card key={label}>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">{label}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-3 w-20" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
