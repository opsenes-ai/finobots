"use client";

import Image from "next/image";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient, createResource, createStore, getWorkspaceId } from "@/lib/client";
import { cn, formatDate } from "@/lib/utils";

export type Connection = {
  id: string;
  provider: "paypal" | "venmo";
  name: string;
  status: "pending" | "active" | "error" | "disconnected";
  last_synced_at: string | null;
  created_at: string;
  metadata: { environment?: "sandbox" | "live" } | null;
};

// The workspace's connections, shared by every card on the page.
export const connectionsResource = createResource(async () => {
  const organizationId = await getWorkspaceId();
  if (!organizationId) return { organizationId: null, items: [] as Connection[] };
  const { data, error } = await createClient()
    .from("connections")
    .select("id, provider, name, status, last_synced_at, created_at, metadata")
    .eq("organization_id", organizationId)
    .neq("status", "disconnected")
    .order("created_at", { ascending: false });
  if (error) toast.error("Couldn't load your connections.");
  return { organizationId, items: (data as Connection[] | null) ?? [] };
});

export const selectedConnection = createStore<string | null>(null);

// Shared by Connect buttons, so they can open the set-up form.
export const setupOpen = createStore(false);

export const STATUS_LABELS: Record<Connection["status"], string> = {
  pending: "Pending",
  active: "Active",
  error: "Needs attention",
  disconnected: "Disconnected",
};

export function StatusBadge({ status }: { status: Connection["status"] }) {
  return (
    <Badge variant={status === "active" ? "secondary" : status === "error" ? "destructive" : "outline"}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}

/** The selected connection, or the first one if none is picked. */
export function useSelectedConnection() {
  const data = connectionsResource.use();
  const selectedId = selectedConnection.use();
  const items = data?.items ?? [];
  return {
    data,
    connection: items.find((item) => item.id === selectedId) ?? items[0] ?? null,
  };
}

// Connected accounts.
export function ConnectionsConnected({ className }: { className?: string }) {
  const { data, connection: current } = useSelectedConnection();

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Connected</CardTitle>
      </CardHeader>
      <CardContent>
        {data === undefined ? (
          <p className="text-muted-foreground text-sm">Loading…</p>
        ) : data.items.length === 0 ? (
          <div className="text-muted-foreground rounded-lg border border-dashed p-6 text-center text-sm">
            Nothing connected yet. Connect PayPal to bring in balances and transactions.
          </div>
        ) : (
          <ul className="space-y-2">
            {data.items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => selectedConnection.set(item.id)}
                  aria-pressed={current?.id === item.id}
                  className={cn(
                    "hover:bg-muted/50 flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                    current?.id === item.id && "border-primary"
                  )}
                >
                  <Image
                    src="/connections/paypal.png"
                    alt=""
                    width={32}
                    height={32}
                    className="shrink-0 rounded-md"
                    style={{ width: 32, height: "auto" }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.name}</p>
                    <p className="text-muted-foreground truncate text-xs">
                      {item.metadata?.environment === "live" ? "Live" : "Sandbox"} · Last synced{" "}
                      {item.last_synced_at ? formatDate(item.last_synced_at, true) : "never"}
                    </p>
                  </div>
                  <StatusBadge status={item.status} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
