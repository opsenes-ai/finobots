"use client";

import { Suspense, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  TransactionAllocation,
  TransactionDetails,
  TransactionReceipt,
  TransactionTimeline,
} from "@/components/pages/console/transactions";
import {
  loadTransaction,
  pinnedTransaction,
  selectedTransaction,
} from "@/components/pages/console/transactions/ledger";
import { cn, formatMoney } from "@/lib/utils";

function TransactionRecord() {
  const { recordId } = useParams<{ recordId: string }>();
  const record = pinnedTransaction.use();
  const selectedId = selectedTransaction.use();

  // Load this transaction by id (it may be outside the ledger's filters) and
  // select it, so the shared cards show it.
  useEffect(() => {
    pinnedTransaction.set(undefined);
    selectedTransaction.set(recordId);
    void loadTransaction(recordId);
  }, [recordId]);

  const current = record && record.id === recordId ? record : record === null ? null : undefined;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <Button
        variant="ghost"
        size="sm"
        className="w-fit"
        render={<Link href="/console/transaction" />}
        nativeButton={false}
      >
        <ArrowLeft />
        Transactions
      </Button>

      {current === undefined ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : current === null ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <h1 className="text-lg font-semibold">Transaction not found</h1>
          <p className="text-muted-foreground mt-1 text-sm">It may have been deleted, or it belongs to another workspace.</p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-semibold">{current.description ?? "Transaction"}</h1>
              <p className="text-muted-foreground text-sm">
                {current.counterparty ?? "Unknown counterparty"} ·{" "}
                <Link href={`/console/accounts/${current.account_id}`} className="underline underline-offset-4">
                  {current.account?.name ?? "Account"}
                </Link>
              </p>
            </div>
            <p className={cn("text-2xl font-semibold tabular-nums", current.amount < 0 && "text-destructive")}>
              {formatMoney(current.amount, current.currency)}
            </p>
          </div>
          {selectedId === recordId ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <TransactionDetails className="h-full" linkToPage={false} />
              <TransactionTimeline className="h-full" />
              <TransactionAllocation className="h-full" />
              <TransactionReceipt className="h-full" />
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

// The route param is read at request time, so it sits inside a Suspense boundary.
export default function TransactionPage() {
  return (
    <Suspense fallback={null}>
      <TransactionRecord />
    </Suspense>
  );
}
