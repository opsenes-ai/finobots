"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { type ColDef, type ValueFormatterParams } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { gridTheme } from "@/components/shared/console/data-grid";
import { createClient, createResource, createStore, getWorkspaceId } from "@/lib/client";
import { formatDate, formatMoney } from "@/lib/utils";

export type TransactionStatus = "pending" | "completed" | "failed" | "refunded" | "cancelled";

export type Transaction = {
  id: string;
  account_id: string;
  external_id: string | null;
  amount: number;
  currency: string;
  status: TransactionStatus;
  description: string | null;
  counterparty: string | null;
  category: string | null;
  occurred_at: string;
  receipt_path: string | null;
  metadata: { reconciled?: { at: string; reference: string | null } } | null;
  created_at: string;
  updated_at: string;
  account: { name: string } | null;
};

export const STATUSES: { value: TransactionStatus | "all"; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "completed", label: "Completed" },
  { value: "pending", label: "Pending" },
  { value: "refunded", label: "Refunded" },
  { value: "failed", label: "Failed" },
  { value: "cancelled", label: "Cancelled" },
];

export type Filters = { search: string; status: TransactionStatus | "all"; accountId: string; days: string };

export const filtersStore = createStore<Filters>({ search: "", status: "all", accountId: "all", days: "90" });

// The newest transactions that match the filters (search is applied in the grid).
const MAX_ROWS = 1000;

const COLUMNS =
  "id, account_id, external_id, amount, currency, status, description, counterparty, category, occurred_at, receipt_path, metadata, created_at, updated_at, account:accounts(name)";

export const transactionsResource = createResource(async () => {
  const organizationId = await getWorkspaceId();
  if (!organizationId) {
    return { organizationId: null, items: [] as Transaction[], accounts: [] as { id: string; name: string }[] };
  }
  const filters = filtersStore.get();
  const supabase = createClient();

  let query = supabase
    .from("transactions")
    .select(COLUMNS)
    .eq("organization_id", organizationId)
    .order("occurred_at", { ascending: false })
    .limit(MAX_ROWS);
  if (filters.status !== "all") query = query.eq("status", filters.status);
  if (filters.accountId !== "all") query = query.eq("account_id", filters.accountId);
  if (filters.days !== "all") {
    query = query.gte("occurred_at", new Date(Date.now() - Number(filters.days) * 86_400_000).toISOString());
  }

  const [{ data, error }, { data: accounts }] = await Promise.all([
    query,
    supabase.from("accounts").select("id, name").eq("organization_id", organizationId).order("name"),
  ]);
  if (error) toast.error("Couldn't load transactions.");
  const items = ((data ?? []) as unknown as Transaction[]).map((item) => ({ ...item, amount: Number(item.amount) }));
  // Keep a transaction open on its own page up to date after changes.
  if (pinnedId) void loadTransaction(pinnedId);
  return { organizationId, items, accounts: (accounts as { id: string; name: string }[] | null) ?? [] };
});

export const selectedTransaction = createStore<string | null>(null);

// One transaction loaded by id, for its own page. It may be outside the
// filtered list. undefined while loading, null if it doesn't exist.
export const pinnedTransaction = createStore<Transaction | null | undefined>(undefined);
let pinnedId: string | null = null;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function loadTransaction(id: string) {
  pinnedId = id;
  if (!UUID.test(id)) {
    pinnedTransaction.set(null);
    return;
  }
  const { data } = await createClient().from("transactions").select(COLUMNS).eq("id", id).maybeSingle();
  if (pinnedId !== id) return;
  const row = data as unknown as Transaction | null;
  pinnedTransaction.set(row ? { ...row, amount: Number(row.amount) } : null);
}

/** The selected transaction, or the newest if none is picked. */
export function useSelectedTransaction() {
  const data = transactionsResource.use();
  const selectedId = selectedTransaction.use();
  const pinned = pinnedTransaction.use();
  const items = data?.items ?? [];
  return {
    data,
    transaction:
      items.find((item) => item.id === selectedId) ??
      (pinned && pinned.id === selectedId ? pinned : null) ??
      items[0] ??
      null,
  };
}

// Every transaction in a sortable, filterable grid (AG Grid Community).
export function TransactionsLedger({ className }: { className?: string }) {
  const data = transactionsResource.use();
  const filters = filtersStore.use();
  const selectedId = selectedTransaction.use();
  const router = useRouter();

  const columns = useMemo<ColDef<Transaction>[]>(
    () => [
      {
        field: "occurred_at",
        headerName: "Date",
        sort: "desc",
        width: 130,
        valueFormatter: (params: ValueFormatterParams<Transaction, string>) => formatDate(params.value),
      },
      { field: "description", headerName: "Description", flex: 2, minWidth: 180 },
      { field: "counterparty", headerName: "Counterparty", flex: 1, minWidth: 140 },
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
    ],
    []
  );

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Ledger</CardTitle>
        <CardDescription>Double-click a row to open it.</CardDescription>
      </CardHeader>
      <CardContent>
        {data === undefined ? (
          <p className="text-muted-foreground text-sm">Loading…</p>
        ) : data.items.length === 0 ? (
          <p className="text-muted-foreground rounded-lg border border-dashed p-6 text-center text-sm">
            No transactions match. Import them from a PayPal connection, or change the filters.
          </p>
        ) : (
          <div className="h-[28rem] w-full">
            <AgGridReact<Transaction>
              theme={gridTheme}
              rowData={data.items}
              columnDefs={columns}
              defaultColDef={{ sortable: true, filter: true, resizable: true }}
              getRowId={(params) => params.data.id}
              quickFilterText={filters.search}
              rowSelection={{ mode: "singleRow", checkboxes: false, enableClickSelection: true }}
              onRowClicked={(event) => event.data && selectedTransaction.set(event.data.id)}
              onRowDoubleClicked={(event) => event.data && router.push(`/console/transaction/${event.data.id}`)}
              onFirstDataRendered={(event) => {
                const id = selectedId ?? data.items[0]?.id;
                if (id) event.api.getRowNode(id)?.setSelected(true);
              }}
              pagination
              paginationPageSize={50}
              paginationPageSizeSelector={[25, 50, 100]}
            />
          </div>
        )}
        {data && data.items.length >= MAX_ROWS ? (
          <p className="text-muted-foreground mt-2 text-xs">Showing the newest {MAX_ROWS}. Narrow the filters to see older ones.</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
