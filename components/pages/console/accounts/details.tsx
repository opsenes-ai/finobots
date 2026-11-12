"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatDate, formatMoney } from "@/lib/utils";
import { typeLabel, useSelectedAccount } from "./listing";

// The selected account.
export function AccountDetails({ className }: { className?: string }) {
  const { data, account } = useSelectedAccount();

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Details</CardTitle>
      </CardHeader>
      <CardContent>
        {!account ? (
          <p className="text-muted-foreground text-sm">
            {data === undefined ? "Loading…" : "Pick an account to see its details."}
          </p>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-muted-foreground text-xs">{account.name}</p>
              <p className={cn("text-2xl font-semibold tabular-nums", account.balance < 0 && "text-destructive")}>
                {formatMoney(account.balance, account.currency)}
              </p>
            </div>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="text-muted-foreground">Type</dt>
              <dd>{typeLabel(account.type)}</dd>
              <dt className="text-muted-foreground">Currency</dt>
              <dd>{account.currency}</dd>
              <dt className="text-muted-foreground">Source</dt>
              <dd className="truncate">{account.connection?.name ?? "Manual"}</dd>
              <dt className="text-muted-foreground">Status</dt>
              <dd>{account.is_active ? "Active" : "Archived"}</dd>
              <dt className="text-muted-foreground">Balance as of</dt>
              <dd>{formatDate(account.balance_updated_at, true)}</dd>
              <dt className="text-muted-foreground">Added</dt>
              <dd>{formatDate(account.created_at)}</dd>
            </dl>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
