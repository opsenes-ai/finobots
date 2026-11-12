"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { createClient } from "@/lib/client";
import {
  ACCOUNT_TYPES,
  accountsResource,
  selectedAccount,
  useSelectedAccount,
  type Account,
  type AccountType,
} from "./listing";

// The form for one account. Keyed by account id, so it resets when the selection changes.
function EditForm({ account }: { account: Account }) {
  const manual = account.connection_id === null;
  const [name, setName] = useState(account.name);
  const [type, setType] = useState<AccountType>(account.type);
  const [active, setActive] = useState(account.is_active);
  const [balance, setBalance] = useState(String(account.balance));
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const balanceValid = Number.isFinite(Number(balance)) && balance.trim() !== "";
  const changed =
    name.trim() !== account.name ||
    type !== account.type ||
    active !== account.is_active ||
    (manual && Number(balance) !== account.balance);

  async function save() {
    if (!name.trim() || (manual && !balanceValid)) return;
    setBusy(true);
    const update: Record<string, unknown> = { name: name.trim(), type, is_active: active };
    // Synced balances come from the provider, so only manual ones can be edited.
    if (manual && Number(balance) !== account.balance) {
      update.balance = Number(balance);
      update.balance_updated_at = new Date().toISOString();
    }
    const { error } = await createClient().from("accounts").update(update).eq("id", account.id);
    setBusy(false);
    if (error) {
      toast.error("Couldn't save. Only owners and admins can edit accounts.");
      return;
    }
    toast.success("Account updated.");
    await accountsResource.reload();
  }

  async function remove() {
    setBusy(true);
    const { error } = await createClient().from("accounts").delete().eq("id", account.id);
    setBusy(false);
    if (error) {
      toast.error("Couldn't delete. Only owners and admins can delete accounts.");
      return;
    }
    selectedAccount.set(null);
    toast.success("Account deleted.");
    await accountsResource.reload();
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="edit-name">Name</Label>
          <Input id="edit-name" maxLength={100} value={name} onChange={(event) => setName(event.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="edit-type">Type</Label>
          <Select items={ACCOUNT_TYPES} value={type} onValueChange={(value) => setType(value as AccountType)}>
            <SelectTrigger id="edit-type" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ACCOUNT_TYPES.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {manual ? (
          <div className="space-y-1.5">
            <Label htmlFor="edit-balance">Balance ({account.currency})</Label>
            <Input
              id="edit-balance"
              type="number"
              inputMode="decimal"
              step="0.01"
              aria-invalid={!balanceValid}
              value={balance}
              onChange={(event) => setBalance(event.target.value)}
            />
          </div>
        ) : null}
        <div className="flex items-center justify-between gap-3 rounded-lg border p-3 sm:self-end">
          <Label htmlFor="edit-active">Active</Label>
          <Switch id="edit-active" checked={active} onCheckedChange={setActive} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" size="sm" disabled={busy || !changed || !name.trim()}>
          {busy ? "Saving…" : "Save changes"}
        </Button>
        {manual ? (
          confirming ? (
            <>
              <Button type="button" size="sm" variant="destructive" disabled={busy} onClick={remove}>
                Delete account and its transactions
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setConfirming(false)}>
                Cancel
              </Button>
            </>
          ) : (
            <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={() => setConfirming(true)}>
              Delete
            </Button>
          )
        ) : (
          <p className="text-muted-foreground text-xs">The balance comes from {account.connection?.name ?? "the connection"}.</p>
        )}
      </div>
    </form>
  );
}

// Edit the selected account.
export function AccountEditing({ className }: { className?: string }) {
  const { data, account } = useSelectedAccount();

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Edit account</CardTitle>
      </CardHeader>
      <CardContent>
        {account ? (
          <EditForm key={account.id} account={account} />
        ) : (
          <p className="text-muted-foreground text-sm">
            {data === undefined ? "Loading…" : "Pick an account to edit it."}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
