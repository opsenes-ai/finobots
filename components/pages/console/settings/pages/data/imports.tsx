"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { createClient, functionErrorMessage, getWorkspaceId } from "@/lib/client";
import { cn } from "@/lib/utils";

type Connection = { id: string; name: string };

const RANGES = [
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
];

// Import transactions from a connected PayPal account.
export function DataImports() {
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [connections, setConnections] = useState<Connection[] | null>(null);
  const [connectionId, setConnectionId] = useState("");
  const [range, setRange] = useState("30");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    async function load() {
      const orgId = await getWorkspaceId();
      setOrganizationId(orgId);
      if (!orgId) {
        setConnections([]);
        return;
      }
      const { data } = await createClient()
        .from("connections")
        .select("id, name")
        .eq("organization_id", orgId)
        .eq("provider", "paypal")
        .eq("status", "active");
      const list = (data as Connection[] | null) ?? [];
      setConnections(list);
      setConnectionId(list[0]?.id ?? "");
    }
    void load();
  }, []);

  async function run() {
    if (!organizationId || !connectionId) return;
    setBusy(true);
    const end = new Date();
    const start = new Date(end.getTime() - Number(range) * 24 * 60 * 60 * 1000);
    const { data, error } = await createClient().functions.invoke("transactions", {
      body: {
        action: "import",
        organization_id: organizationId,
        connection_id: connectionId,
        start: start.toISOString(),
        end: end.toISOString(),
      },
    });
    setBusy(false);
    if (error) {
      toast.error(await functionErrorMessage(error));
      return;
    }
    // Functions reply with { data: ... }.
    const count = (data as { data?: { imported?: number } } | null)?.data?.imported;
    toast.success(typeof count === "number" ? `Imported ${count} transactions.` : "Import finished.");
  }

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-medium">Imports</h3>

      {connections === null ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : connections.length === 0 ? (
        <p className="text-muted-foreground rounded-lg border border-dashed p-4 text-center text-sm">
          No PayPal account connected.{" "}
          <Link href="/console/connections" className="text-foreground underline underline-offset-4">
            Connect one
          </Link>
        </p>
      ) : (
        <div className="space-y-4 rounded-lg border p-3">
          {connections.length > 1 ? (
            <RadioGroup
              value={connectionId}
              onValueChange={setConnectionId}
              aria-label="Account to import from"
            >
              {connections.map((connection) => (
                <Label
                  key={connection.id}
                  htmlFor={`import-${connection.id}`}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-lg border p-2 font-normal",
                    connectionId === connection.id && "border-primary"
                  )}
                >
                  <RadioGroupItem id={`import-${connection.id}`} value={connection.id} />
                  {connection.name}
                </Label>
              ))}
            </RadioGroup>
          ) : (
            <p className="text-sm font-medium">{connections[0].name}</p>
          )}

          <RadioGroup value={range} onValueChange={setRange} aria-label="Date range" className="grid-cols-2">
            {RANGES.map((option) => (
              <Label
                key={option.value}
                htmlFor={`range-${option.value}`}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-lg border p-2 font-normal",
                  range === option.value && "border-primary"
                )}
              >
                <RadioGroupItem id={`range-${option.value}`} value={option.value} />
                {option.label}
              </Label>
            ))}
          </RadioGroup>

          <Button size="sm" disabled={busy || !connectionId} onClick={run}>
            {busy ? "Importing…" : "Import"}
          </Button>
        </div>
      )}
    </section>
  );
}
