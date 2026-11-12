"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { callFunction } from "@/lib/client";
import { connectionsResource, focusSetup, usePayPalConnected } from "./connected";

type SyncResult = { results: { status: "active" | "error" }[] };

// Sync every connection, or connect PayPal if it isn't yet.
export function ConnectionActions() {
  const data = connectionsResource.use();
  const connected = usePayPalConnected();
  const [busy, setBusy] = useState(false);

  async function syncAll() {
    if (!data?.organizationId) return;
    setBusy(true);
    const { data: result, error } = await callFunction<SyncResult>("accounts", {
      action: "sync",
      organization_id: data.organizationId,
    });
    setBusy(false);
    if (error) {
      toast.error(error);
      return;
    }
    const failed = result?.results.filter((item) => item.status === "error").length ?? 0;
    if (failed) toast.error(`${failed} connection${failed === 1 ? "" : "s"} couldn't sync.`);
    else toast.success("All connections synced.");
    await connectionsResource.reload();
  }

  if (connected === undefined) return null;

  return connected ? (
    <Button variant="outline" size="sm" disabled={busy} onClick={syncAll}>
      {busy ? "Syncing…" : "Sync all"}
    </Button>
  ) : (
    <Button size="sm" onClick={focusSetup}>
      Connect PayPal
    </Button>
  );
}
