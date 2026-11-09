import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// Receipt preview and upload.
export function TransactionReceipt({ className }: { className?: string }) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Receipt</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-8 w-28" />
      </CardContent>
    </Card>
  );
}
