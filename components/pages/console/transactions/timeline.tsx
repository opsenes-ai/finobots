"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { useSelectedTransaction } from "./ledger";

// What happened to the selected transaction, oldest first.
export function TransactionTimeline({ className }: { className?: string }) {
  const { data, transaction } = useSelectedTransaction();

  const events = transaction
    ? [
        { at: transaction.occurred_at, label: "Happened", note: transaction.counterparty },
        {
          at: transaction.created_at,
          label: transaction.external_id ? "Imported from PayPal" : "Added",
          note: transaction.external_id,
        },
        ...(transaction.metadata?.reconciled
          ? [{ at: transaction.metadata.reconciled.at, label: "Reconciled", note: transaction.metadata.reconciled.reference }]
          : []),
        ...(transaction.updated_at !== transaction.created_at
          ? [{ at: transaction.updated_at, label: "Last changed", note: null }]
          : []),
      ].sort((a, b) => a.at.localeCompare(b.at))
    : [];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        {!transaction ? (
          <p className="text-muted-foreground text-sm">
            {data === undefined ? "Loading…" : "Pick a transaction to see its history."}
          </p>
        ) : (
          <ol className="space-y-4 border-l pl-5">
            {events.map((event, i) => (
              <li key={`${event.label}-${i}`} className="relative">
                <span aria-hidden className="bg-primary absolute top-1.5 -left-[1.6rem] size-2.5 rounded-full" />
                <p className="text-sm font-medium">{event.label}</p>
                <p className="text-muted-foreground text-xs">
                  {formatDate(event.at, true)}
                  {event.note ? ` · ${event.note}` : ""}
                </p>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
