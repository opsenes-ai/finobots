"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { callFunction } from "@/lib/client";
import { formatDate } from "@/lib/utils";
import { connectionsResource, selectedConnection, StatusBadge, useSelectedConnection } from "./connected";

type SyncResult = { results: { status: "active" | "error"; accounts?: number; message?: string }[] };

// The selected connection, with test, sync, import and disconnect.
export function ConnectionDetails({ className, linkToPage = true }: { className?: string; linkToPage?: boolean }) {
  const { data, connection } = useSelectedConnection();
  const [busy, setBusy] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  async function run(key: string, task: () => Promise<void>) {
    setBusy(key);
    try {
      await task();
    } finally {
      setBusy(null);
    }
  }

  const organizationId = data?.organizationId;

  const test = () =>
    run("test", async () => {
      const { data: result, error } = await callFunction<{ status: string }>("connections", {
        action: "test",
        organization_id: organizationId,
        connection_id: connection!.id,
      });
      if (error) toast.error(error);
      else if (result?.status === "active") toast.success("PayPal accepted the credentials.");
      else toast.error("PayPal rejected the credentials. Reconnect with a new secret.");
      await connectionsResource.reload();
    });

  const sync = () =>
    run("sync", async () => {
      const { data: result, error } = await callFunction<SyncResult>("accounts", {
        action: "sync",
        organization_id: organizationId,
        connection_id: connection!.id,
      });
      const outcome = result?.results[0];
      if (error) toast.error(error);
      else if (outcome?.status === "error") toast.error(outcome.message ?? "Sync failed.");
      else toast.success(`Balances updated for ${outcome?.accounts ?? 0} currencies.`);
      await connectionsResource.reload();
    });

  const importTransactions = () =>
    run("import", async () => {
      const end = new Date();
      const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
      const { data: result, error } = await callFunction<{ imported: number }>("transactions", {
        action: "import",
        organization_id: organizationId,
        connection_id: connection!.id,
        start: start.toISOString(),
        end: end.toISOString(),
      });
      if (error) toast.error(error);
      else toast.success(`Imported ${result?.imported ?? 0} transactions from the last 30 days.`);
      await connectionsResource.reload();
    });

  const disconnect = () =>
    run("disconnect", async () => {
      const { error } = await callFunction("connections", {
        action: "disconnect",
        organization_id: organizationId,
        connection_id: connection!.id,
      });
      setConfirming(false);
      if (error) {
        toast.error(error);
        return;
      }
      selectedConnection.set(null);
      toast.success("Disconnected. Its credentials were deleted.");
      await connectionsResource.reload();
    });

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Details</CardTitle>
        {linkToPage && connection ? (
          <CardAction>
            <Button variant="ghost" size="sm" render={<Link href={`/console/connections/${connection.id}`} />} nativeButton={false}>
              Open
            </Button>
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent>
        {!connection ? (
          <p className="text-muted-foreground text-sm">
            {data === undefined ? "Loading…" : "Pick a connection to see its details."}
          </p>
        ) : (
          <div className="space-y-4">
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="text-muted-foreground">Name</dt>
              <dd className="truncate">{connection.name}</dd>
              <dt className="text-muted-foreground">Status</dt>
              <dd>
                <StatusBadge status={connection.status} />
              </dd>
              <dt className="text-muted-foreground">Environment</dt>
              <dd>{connection.metadata?.environment === "live" ? "Live" : "Sandbox"}</dd>
              <dt className="text-muted-foreground">Last synced</dt>
              <dd>{connection.last_synced_at ? formatDate(connection.last_synced_at, true) : "Never"}</dd>
              <dt className="text-muted-foreground">Added</dt>
              <dd>{formatDate(connection.created_at)}</dd>
            </dl>

            <div className="flex flex-wrap gap-2">
              <Button size="sm" disabled={busy !== null} onClick={sync}>
                {busy === "sync" ? "Syncing…" : "Sync balances"}
              </Button>
              <Button size="sm" variant="outline" disabled={busy !== null} onClick={importTransactions}>
                {busy === "import" ? "Importing…" : "Import transactions"}
              </Button>
              <Button size="sm" variant="outline" disabled={busy !== null} onClick={test}>
                {busy === "test" ? "Testing…" : "Test"}
              </Button>
            </div>

            {confirming ? (
              <div className="flex flex-wrap items-center gap-2 rounded-lg border border-destructive/40 p-3">
                <p className="text-sm">Disconnect and delete its credentials?</p>
                <Button size="sm" variant="destructive" disabled={busy !== null} onClick={disconnect}>
                  Disconnect
                </Button>
                <Button size="sm" variant="ghost" disabled={busy !== null} onClick={() => setConfirming(false)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <Button size="sm" variant="ghost" disabled={busy !== null} onClick={() => setConfirming(true)}>
                Disconnect
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
