"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { callFunction } from "@/lib/client";
import { accountsResource } from "./listing";

type SyncResult = { results: { status: "active" | "error"; message?: string }[] };

// Refresh balances from every connection.
export function AccountsActions() {
  const data = accountsResource.use();
  const [busy, setBusy] = useState(false);

  async function sync() {
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
    const results = result?.results ?? [];
    if (results.length === 0) toast.info("Nothing to sync. Connect PayPal first.");
    else if (results.some((item) => item.status === "error")) toast.error("Some connections couldn't sync.");
    else toast.success("Balances updated.");
    await accountsResource.reload();
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" render={<Link href="/console/connections" />} nativeButton={false}>
        Connections
      </Button>
      <Button size="sm" disabled={busy || !data?.organizationId} onClick={sync}>
        {busy ? "Syncing…" : "Sync balances"}
      </Button>
    </div>
  );
}
