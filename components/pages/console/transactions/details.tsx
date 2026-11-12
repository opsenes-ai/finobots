"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatDate, formatMoney } from "@/lib/utils";
import { useSelectedTransaction } from "./ledger";

// The selected transaction.
export function TransactionDetails({ className }: { className?: string }) {
  const { data, transaction } = useSelectedTransaction();

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Details</CardTitle>
      </CardHeader>
      <CardContent>
        {!transaction ? (
          <p className="text-muted-foreground text-sm">
            {data === undefined ? "Loading…" : "Pick a transaction to see its details."}
          </p>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-muted-foreground truncate text-xs">{transaction.description ?? "No description"}</p>
              <p className={cn("text-2xl font-semibold tabular-nums", transaction.amount < 0 && "text-destructive")}>
                {formatMoney(transaction.amount, transaction.currency)}
              </p>
            </div>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="text-muted-foreground">Status</dt>
              <dd>
                <Badge variant={transaction.status === "completed" ? "secondary" : "outline"}>
                  {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                </Badge>
              </dd>
              <dt className="text-muted-foreground">Date</dt>
              <dd>{formatDate(transaction.occurred_at, true)}</dd>
              <dt className="text-muted-foreground">Counterparty</dt>
              <dd className="truncate">{transaction.counterparty ?? "–"}</dd>
              <dt className="text-muted-foreground">Account</dt>
              <dd className="truncate">{transaction.account?.name ?? "–"}</dd>
              <dt className="text-muted-foreground">Category</dt>
              <dd>{transaction.category ?? "Uncategorised"}</dd>
              <dt className="text-muted-foreground">Reference</dt>
              <dd className="truncate font-mono text-xs">{transaction.external_id ?? "–"}</dd>
            </dl>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
