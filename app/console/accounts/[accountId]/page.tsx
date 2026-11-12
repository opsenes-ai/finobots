"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AccountDetails,
  AccountEditing,
} from "@/components/pages/console/accounts";
import { accountsResource, selectedAccount } from "@/components/pages/console/accounts/listing";
import { createClient } from "@/lib/client";
import { cn, formatDate, formatMoney } from "@/lib/utils";

type Row = {
  id: string;
  occurred_at: string;
  description: string | null;
  counterparty: string | null;
  category: string | null;
  status: string;
  amount: number;
  currency: string;
};

const RECENT_LIMIT = 50;

// The newest transactions on one account, each linking to its own page.
function AccountTransactions({ accountId }: { accountId: string }) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const accounts = accountsResource.use();

  useEffect(() => {
    async function load() {
      const { data } = await createClient()
        .from("transactions")
        .select("id, occurred_at, description, counterparty, category, status, amount, currency")
        .eq("account_id", accountId)
        .order("occurred_at", { ascending: false })
        .limit(RECENT_LIMIT);
      setRows(((data ?? []) as Row[]).map((row) => ({ ...row, amount: Number(row.amount) })));
    }
    void load();
    // Reloads when the account changes, for example after editing its balance.
  }, [accountId, accounts]);

  return (
    <Card className="sm:col-span-2 xl:col-span-3">
      <CardHeader>
        <CardTitle>Recent transactions</CardTitle>
      </CardHeader>
      <CardContent>
        {rows === null ? (
          <p className="text-muted-foreground text-sm">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-muted-foreground rounded-lg border border-dashed p-6 text-center text-sm">
            No transactions on this account yet.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="whitespace-nowrap">{formatDate(row.occurred_at)}</TableCell>
                  <TableCell className="max-w-64">
                    <Link
                      href={`/console/transaction/${row.id}`}
                      className="block truncate font-medium underline-offset-4 hover:underline"
                    >
                      {row.description ?? "No description"}
                    </Link>
                    {row.counterparty ? (
                      <span className="text-muted-foreground block truncate text-xs">{row.counterparty}</span>
                    ) : null}
                  </TableCell>
                  <TableCell>{row.category ?? "–"}</TableCell>
                  <TableCell>
                    <Badge variant={row.status === "completed" ? "secondary" : "outline"}>
                      {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className={cn("text-right tabular-nums", row.amount < 0 && "text-destructive")}>
                    {formatMoney(row.amount, row.currency)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {rows && rows.length >= RECENT_LIMIT ? (
          <p className="text-muted-foreground mt-2 text-xs">
            Showing the newest {RECENT_LIMIT}. See them all in{" "}
            <Link href="/console/transaction" className="underline underline-offset-4">
              Transactions
            </Link>
            .
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function AccountRecord() {
  const { accountId } = useParams<{ accountId: string }>();
  const data = accountsResource.use();
  const selectedId = selectedAccount.use();

  // The shared cards show the selected account, so select this one.
  useEffect(() => {
    selectedAccount.set(accountId);
  }, [accountId]);

  const account = data?.items.find((item) => item.id === accountId);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <Button
        variant="ghost"
        size="sm"
        className="w-fit"
        render={<Link href="/console/accounts" />}
        nativeButton={false}
      >
        <ArrowLeft />
        Accounts
      </Button>

      {data === undefined ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : !account ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <h1 className="text-lg font-semibold">Account not found</h1>
          <p className="text-muted-foreground mt-1 text-sm">It may have been deleted, or it belongs to another workspace.</p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold">{account.name}</h1>
            {!account.is_active ? <Badge variant="outline">Archived</Badge> : null}
          </div>
          {selectedId === accountId ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <AccountDetails className="h-full" linkToPage={false} />
              <AccountEditing className="h-full xl:col-span-2" />
              <AccountTransactions accountId={accountId} />
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

// The route param is read at request time, so it sits inside a Suspense boundary.
export default function AccountPage() {
  return (
    <Suspense fallback={null}>
      <AccountRecord />
    </Suspense>
  );
}
