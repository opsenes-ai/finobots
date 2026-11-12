"use client";

import { Landmark, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient, createResource, createStore, getWorkspaceId } from "@/lib/client";
import { cn, formatDate, formatMoney } from "@/lib/utils";

export type AccountType = "checking" | "savings" | "credit" | "wallet" | "other";

export type Account = {
  id: string;
  name: string;
  type: AccountType;
  currency: string;
  balance: number;
  balance_updated_at: string | null;
  is_active: boolean;
  connection_id: string | null;
  external_id: string | null;
  created_at: string;
  connection: { name: string } | null;
};

export const ACCOUNT_TYPES: { value: AccountType; label: string }[] = [
  { value: "checking", label: "Checking" },
  { value: "savings", label: "Savings" },
  { value: "credit", label: "Credit" },
  { value: "wallet", label: "Wallet" },
  { value: "other", label: "Other" },
];

export const typeLabel = (type: AccountType) =>
  ACCOUNT_TYPES.find((option) => option.value === type)?.label ?? type;

// The workspace's accounts, shared by every card on the page.
export const accountsResource = createResource(async () => {
  const organizationId = await getWorkspaceId();
  if (!organizationId) return { organizationId: null, items: [] as Account[] };
  const { data, error } = await createClient()
    .from("accounts")
    .select(
      "id, name, type, currency, balance, balance_updated_at, is_active, connection_id, external_id, created_at, connection:connections(name)"
    )
    .eq("organization_id", organizationId)
    .order("is_active", { ascending: false })
    .order("name");
  if (error) toast.error("Couldn't load your accounts.");
  const items = ((data ?? []) as unknown as Account[]).map((item) => ({
    ...item,
    balance: Number(item.balance),
  }));
  return { organizationId, items };
});

export const selectedAccount = createStore<string | null>(null);

/** The selected account, or the first one if none is picked. */
export function useSelectedAccount() {
  const data = accountsResource.use();
  const selectedId = selectedAccount.use();
  const items = data?.items ?? [];
  return { data, account: items.find((item) => item.id === selectedId) ?? items[0] ?? null };
}

// List of all accounts.
export function AccountsListing({ className }: { className?: string }) {
  const { data, account: current } = useSelectedAccount();

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>All accounts</CardTitle>
      </CardHeader>
      <CardContent>
        {data === undefined ? (
          <p className="text-muted-foreground text-sm">Loading…</p>
        ) : data.items.length === 0 ? (
          <p className="text-muted-foreground rounded-lg border border-dashed p-6 text-center text-sm">
            No accounts yet. Sync a connection or add one manually.
          </p>
        ) : (
          <ul className="space-y-2">
            {data.items.map((item) => {
              const Icon = item.connection_id ? Wallet : Landmark;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => selectedAccount.set(item.id)}
                    aria-pressed={current?.id === item.id}
                    className={cn(
                      "hover:bg-muted/50 flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                      current?.id === item.id && "border-primary",
                      !item.is_active && "opacity-60"
                    )}
                  >
                    <div className="bg-muted flex size-10 shrink-0 items-center justify-center rounded-lg">
                      <Icon className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{item.name}</p>
                      <p className="text-muted-foreground truncate text-xs">
                        {typeLabel(item.type)} · {item.connection?.name ?? "Manual"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={cn("text-sm font-medium tabular-nums", item.balance < 0 && "text-destructive")}>
                        {formatMoney(item.balance, item.currency)}
                      </p>
                      {item.is_active ? (
                        <p className="text-muted-foreground text-xs">
                          {item.balance_updated_at ? formatDate(item.balance_updated_at) : "Not synced"}
                        </p>
                      ) : (
                        <Badge variant="outline">Archived</Badge>
                      )}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
