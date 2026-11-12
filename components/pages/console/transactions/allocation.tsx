"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { callFunction } from "@/lib/client";
import { cn, formatDate } from "@/lib/utils";
import { transactionsResource, useSelectedTransaction, type Transaction } from "./ledger";

const PRESETS = ["Sales", "Refunds", "Fees", "Software", "Payroll", "Travel", "Marketing", "Transfers"];

function AllocationForm({ transaction, organizationId }: { transaction: Transaction; organizationId: string }) {
  const [custom, setCustom] = useState("");
  const [reference, setReference] = useState("");
  const [busy, setBusy] = useState(false);

  async function categorise(category: string | null) {
    setBusy(true);
    const { error } = await callFunction("transactions", {
      action: "categorise",
      organization_id: organizationId,
      transaction_ids: [transaction.id],
      category,
    });
    setBusy(false);
    if (error) {
      toast.error(error);
      return;
    }
    setCustom("");
    await transactionsResource.reload();
  }

  async function reconcile() {
    setBusy(true);
    const { error } = await callFunction("transactions", {
      action: "reconcile",
      organization_id: organizationId,
      transaction_ids: [transaction.id],
      ...(reference.trim() ? { reference: reference.trim() } : {}),
    });
    setBusy(false);
    if (error) {
      toast.error(error);
      return;
    }
    setReference("");
    toast.success("Marked as reconciled.");
    await transactionsResource.reload();
  }

  const reconciled = transaction.metadata?.reconciled;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-muted-foreground text-xs">Category</p>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((preset) => (
            <Button
              key={preset}
              type="button"
              size="xs"
              variant={transaction.category === preset ? "default" : "outline"}
              disabled={busy}
              aria-pressed={transaction.category === preset}
              onClick={() => categorise(transaction.category === preset ? null : preset)}
            >
              {preset}
            </Button>
          ))}
        </div>
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (custom.trim()) void categorise(custom.trim());
          }}
        >
          <Label htmlFor="custom-category" className="sr-only">
            Custom category
          </Label>
          <Input
            id="custom-category"
            maxLength={60}
            placeholder="Other category"
            value={custom}
            onChange={(event) => setCustom(event.target.value)}
          />
          <Button type="submit" size="sm" variant="outline" disabled={busy || !custom.trim()}>
            Set
          </Button>
        </form>
      </div>

      <div className="space-y-2">
        <p className="text-muted-foreground text-xs">Reconciliation</p>
        {reconciled ? (
          <p className={cn("text-sm")}>
            Reconciled {formatDate(reconciled.at)}
            {reconciled.reference ? ` · ${reconciled.reference}` : ""}
          </p>
        ) : (
          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              void reconcile();
            }}
          >
            <Label htmlFor="reconcile-reference" className="sr-only">
              Reference
            </Label>
            <Input
              id="reconcile-reference"
              maxLength={200}
              placeholder="Reference (optional)"
              value={reference}
              onChange={(event) => setReference(event.target.value)}
            />
            <Button type="submit" size="sm" disabled={busy}>
              Reconcile
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

// Category and reconciliation for the selected transaction.
export function TransactionAllocation({ className }: { className?: string }) {
  const { data, transaction } = useSelectedTransaction();

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Allocation</CardTitle>
      </CardHeader>
      <CardContent>
        {transaction && data?.organizationId ? (
          <AllocationForm key={transaction.id} transaction={transaction} organizationId={data.organizationId} />
        ) : (
          <p className="text-muted-foreground text-sm">
            {data === undefined ? "Loading…" : "Pick a transaction to categorise it."}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
