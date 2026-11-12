"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ColDef } from "ag-grid-community";
import { DataGrid } from "@/components/shared/console/data-grid";
import {
  AccountDetails,
  AccountEditing,
} from "@/components/pages/console/accounts";
import { accountsResource, selectedAccount } from "@/components/pages/console/accounts/listing";
import { createClient } from "@/lib/client";
import { formatDate, formatMoney } from "@/lib/utils";

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

const RECENT_LIMIT = 200;

const columns: ColDef<Row>[] = [
  { field: "occurred_at", headerName: "Date", sort: "desc", width: 130, valueFormatter: (p) => formatDate(p.value) },
  { field: "description", headerName: "Description", flex: 2, minWidth: 170, valueFormatter: (p) => p.value ?? "No description" },
  { field: "counterparty", headerName: "Counterparty", flex: 1, minWidth: 140, valueFormatter: (p) => p.value ?? "–" },
  { field: "category", headerName: "Category", width: 140, valueFormatter: (p) => p.value ?? "–" },
  {
    field: "status",
    headerName: "Status",
    width: 120,
    valueFormatter: (p) => (p.value ? p.value.charAt(0).toUpperCase() + p.value.slice(1) : ""),
  },
  {
    field: "amount",
    headerName: "Amount",
    type: "rightAligned",
    width: 140,
    valueFormatter: (p) => (p.data ? formatMoney(p.data.amount, p.data.currency) : ""),
    cellClass: (p) => ((p.value ?? 0) < 0 ? "text-destructive tabular-nums" : "tabular-nums"),
  },
];

// The newest transactions on one account, each linking to its own page.
function AccountTransactions({ accountId }: { accountId: string }) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const accounts = accountsResource.use();
  const router = useRouter();

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
          <DataGrid<Row>
            rows={rows}
            columns={columns}
            getRowId={(row) => row.id}
            heightClass="h-[26rem]"
            onRowClick={(row) => router.push(`/console/transaction/${row.id}`)}
          />
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
