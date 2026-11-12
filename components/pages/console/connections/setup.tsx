"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { callFunction } from "@/lib/client";
import { connectionsResource, selectedConnection, setupOpen } from "./connected";

const ENVIRONMENTS = [
  { value: "sandbox", label: "Sandbox" },
  { value: "live", label: "Live" },
];

// Connect a PayPal REST app. The secret is checked with PayPal, then stored
// encrypted on the server and never shown again.
export function ConnectionSetup({ className }: { className?: string }) {
  const open = setupOpen.use();
  const data = connectionsResource.use();
  const [name, setName] = useState("PayPal sandbox");
  const [environment, setEnvironment] = useState("sandbox");
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [busy, setBusy] = useState(false);

  // Shown straight away when nothing is connected yet.
  const showForm = open || data?.items.length === 0;

  async function connect() {
    const organizationId = data?.organizationId;
    if (!organizationId) return;
    setBusy(true);
    const { data: result, error } = await callFunction<{ connection: { id: string } }>("connections", {
      action: "connect",
      organization_id: organizationId,
      provider: "paypal",
      name: name.trim(),
      environment,
      client_id: clientId.trim(),
      client_secret: clientSecret.trim(),
    });
    setBusy(false);
    if (error || !result) {
      toast.error(error ?? "Couldn't connect. Try again.");
      return;
    }
    setClientId("");
    setClientSecret("");
    setupOpen.set(false);
    await connectionsResource.reload();
    selectedConnection.set(result.connection.id);
    toast.success("PayPal connected. Sync it to bring in balances and transactions.");
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Set up</CardTitle>
        <CardDescription>Use the client ID and secret from your PayPal developer app.</CardDescription>
      </CardHeader>
      <CardContent>
        {showForm ? (
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              void connect();
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="connection-name">Name</Label>
              <Input
                id="connection-name"
                required
                maxLength={100}
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="connection-environment">Environment</Label>
              <Select
                items={ENVIRONMENTS}
                value={environment}
                onValueChange={(value) => setEnvironment(String(value))}
              >
                <SelectTrigger id="connection-environment" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ENVIRONMENTS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="client-id">Client ID</Label>
              <Input
                id="client-id"
                required
                autoComplete="off"
                maxLength={200}
                value={clientId}
                onChange={(event) => setClientId(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="client-secret">Secret</Label>
              <Input
                id="client-secret"
                type="password"
                required
                autoComplete="off"
                maxLength={200}
                value={clientSecret}
                onChange={(event) => setClientSecret(event.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="submit"
                size="sm"
                disabled={busy || !data?.organizationId || !name.trim() || !clientId.trim() || !clientSecret.trim()}
              >
                {busy ? "Checking with PayPal…" : "Connect"}
              </Button>
              {data && data.items.length > 0 ? (
                <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={() => setupOpen.set(false)}>
                  Cancel
                </Button>
              ) : null}
            </div>
          </form>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setupOpen.set(true)}>
            Add another connection
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
