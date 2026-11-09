import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// Interactive visual workspace.
export function CashflowCanvas({ className }: { className?: string }) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Canvas</CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        <Skeleton className="h-full min-h-72 w-full" />
      </CardContent>
    </Card>
  );
}
