import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// Available connectors. PayPal is the first; the rest are placeholders.
export function ConnectionsCatalogue({ className }: { className?: string }) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Catalogue</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex items-center gap-3 rounded-lg border p-3">
          <Image
            src="/connections/paypal.png"
            alt=""
            width={40}
            height={40}
            className="shrink-0 rounded-lg"
            style={{ width: 40, height: "auto" }}
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">PayPal</p>
            <p className="truncate text-xs text-muted-foreground">
              Payments, balances, and invoices
            </p>
          </div>
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-lg border p-3">
            <Skeleton className="size-10 shrink-0 rounded-lg" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
