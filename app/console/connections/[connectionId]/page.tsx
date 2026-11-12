"use client";

import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ColDef } from "ag-grid-community";
import { DataGrid } from "@/components/shared/console/data-grid";
import { ConnectionDetails } from "@/components/pages/console/connections";
import {
  connectionsResource,
  selectedConnection,
  StatusBadge,
} from "@/components/pages/console/connections/connected";
import { createClient } from "@/lib/client";
import { cn, formatDate, formatMoney } from "@/lib/utils";

type LinkedAccount = { id: string; name: string; currency: string; balance: number; balance_updated_at: string | null };
type Activity = {
  id: string;
  occurred_at: string;
  description: string | null;
  amount: number;
  currency: string;
  account_id: string;
};

const activityColumns: ColDef<Activity>[] = [
  { field: "occurred_at", headerName: "Date", sort: "desc", width: 130, valueFormatter: (p) => formatDate(p.value) },
  { field: "description", headerName: "Description", flex: 1, minWidth: 170, valueFormatter: (p) => p.value ?? "No description" },
  {
    field: "amount",
    headerName: "Amount",
    type: "rightAligned",
    width: 140,
    valueFormatter: (p) => (p.data ? formatMoney(p.data.amount, p.data.currency) : ""),
    cellClass: (p) => ((p.value ?? 0) < 0 ? "text-destructive tabular-nums" : "tabular-nums"),
  },
];

// The accounts this connection keeps in sync, and their latest activity.
function ConnectionData({ connectionId, refreshKey }: { connectionId: string; refreshKey: unknown }) {
  const [accounts, setAccounts] = useState<LinkedAccount[] | null>(null);
  const [activity, setActivity] = useState<Activity[] | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("accounts")
        .select("id, name, currency, balance, balance_updated_at")
        .eq("connection_id", connectionId)
        .order("name");
      const list = ((data ?? []) as LinkedAccount[]).map((item) => ({ ...item, balance: Number(item.balance) }));
      setAccounts(list);

      if (list.length === 0) {
        setActivity([]);
        return;
      }
      const { data: rows } = await supabase
        .from("transactions")
        .select("id, occurred_at, description, amount, currency, account_id")
        .in(
          "account_id",
          list.map((item) => item.id)
        )
        .order("occurred_at", { ascending: false })
        .limit(100);
      setActivity(((rows ?? []) as Activity[]).map((row) => ({ ...row, amount: Number(row.amount) })));
    }
    void load();
    // Reloads after a sync or import, which reload the connection list.
  }, [connectionId, refreshKey]);

  return (
    <>
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          {accounts === null ? (
            <p className="text-muted-foreground text-sm">Loading…</p>
          ) : accounts.length === 0 ? (
            <p className="text-muted-foreground text-sm">No accounts yet. Sync balances to create them.</p>
          ) : (
            <ul className="space-y-2">
              {accounts.map((item) => (
                <li key={item.id}>
                  <Link
                    href={`/console/accounts/${item.id}`}
                    className="hover:bg-muted/50 flex items-center justify-between gap-3 rounded-lg border p-3 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{item.name}</p>
                      <p className="text-muted-foreground text-xs">
                        {item.balance_updated_at ? `Synced ${formatDate(item.balance_updated_at, true)}` : "Not synced"}
                      </p>
                    </div>
                    <span className={cn("text-sm font-medium tabular-nums", item.balance < 0 && "text-destructive")}>
                      {formatMoney(item.balance, item.currency)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="h-full sm:col-span-2">
        <CardHeader>
          <CardTitle>Latest activity</CardTitle>
        </CardHeader>
        <CardContent>
          {activity === null ? (
            <p className="text-muted-foreground text-sm">Loading…</p>
          ) : activity.length === 0 ? (
            <p className="text-muted-foreground text-sm">No transactions yet. Import them from Details.</p>
          ) : (
            <DataGrid<Activity>
              rows={activity}
              columns={activityColumns}
              getRowId={(row) => row.id}
              heightClass="h-80"
              pageSize={10}
              onRowClick={(row) => router.push(`/console/transaction/${row.id}`)}
            />
          )}
        </CardContent>
      </Card>
    </>
  );
}

function ConnectionRecord() {
  const { connectionId } = useParams<{ connectionId: string }>();
  const data = connectionsResource.use();
  const selectedId = selectedConnection.use();

  // The shared Details card shows the selected connection, so select this one.
  useEffect(() => {
    selectedConnection.set(connectionId);
  }, [connectionId]);

  const connection = data?.items.find((item) => item.id === connectionId);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <Button
        variant="ghost"
        size="sm"
        className="w-fit"
        render={<Link href="/console/connections" />}
        nativeButton={false}
      >
        <ArrowLeft />
        Connections
      </Button>

      {data === undefined ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : !connection ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <h1 className="text-lg font-semibold">Connection not found</h1>
          <p className="text-muted-foreground mt-1 text-sm">It may have been disconnected, or it belongs to another workspace.</p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <Image
              src="/connections/paypal.png"
              alt=""
              width={32}
              height={32}
              className="rounded-md"
              style={{ width: 32, height: "auto" }}
            />
            <h1 className="text-2xl font-semibold">{connection.name}</h1>
            <StatusBadge status={connection.status} />
          </div>
          {selectedId === connectionId ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <ConnectionDetails className="h-full" linkToPage={false} />
              <ConnectionData connectionId={connectionId} refreshKey={data} />
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

// The route param is read at request time, so it sits inside a Suspense boundary.
export default function ConnectionPage() {
  return (
    <Suspense fallback={null}>
      <ConnectionRecord />
    </Suspense>
  );
}
