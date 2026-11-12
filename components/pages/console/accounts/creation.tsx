"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createClient } from "@/lib/client";
import { ACCOUNT_TYPES, accountsResource, selectedAccount, type AccountType } from "./listing";

// Add an account by hand, for money held outside a connection.
export function AccountCreation({ className }: { className?: string }) {
  const data = accountsResource.use();
  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("checking");
  const [currency, setCurrency] = useState("USD");
  const [balance, setBalance] = useState("");
  const [busy, setBusy] = useState(false);

  const currencyValid = /^[A-Z]{3}$/.test(currency);
  const balanceValid = balance.trim() === "" || Number.isFinite(Number(balance));

  async function create() {
    if (!data?.organizationId || !name.trim() || !currencyValid || !balanceValid) return;
    setBusy(true);
    const { data: created, error } = await createClient()
      .from("accounts")
      .insert({
        organization_id: data.organizationId,
        name: name.trim(),
        type,
        currency,
        balance: balance.trim() === "" ? 0 : Number(balance),
        balance_updated_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    setBusy(false);
    if (error) {
      toast.error("Couldn't add the account. Only owners and admins can do this.");
      return;
    }
    setName("");
    setBalance("");
    await accountsResource.reload();
    selectedAccount.set(created.id as string);
    toast.success("Account added.");
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Add account</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            void create();
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="account-name">Name</Label>
            <Input
              id="account-name"
              required
              maxLength={100}
              placeholder="For example: Business savings"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="account-type">Type</Label>
              <Select items={ACCOUNT_TYPES} value={type} onValueChange={(value) => setType(value as AccountType)}>
                <SelectTrigger id="account-type" className="w-full">
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
            <div className="space-y-1.5">
              <Label htmlFor="account-currency">Currency</Label>
              <Input
                id="account-currency"
                maxLength={3}
                aria-invalid={!currencyValid}
                value={currency}
                onChange={(event) => setCurrency(event.target.value.toUpperCase())}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="account-balance">Opening balance</Label>
            <Input
              id="account-balance"
              type="number"
              inputMode="decimal"
              step="0.01"
              placeholder="0.00"
              aria-invalid={!balanceValid}
              value={balance}
              onChange={(event) => setBalance(event.target.value)}
            />
          </div>
          <Button
            type="submit"
            size="sm"
            disabled={busy || !data?.organizationId || !name.trim() || !currencyValid || !balanceValid}
          >
            {busy ? "Adding…" : "Add account"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
