// Sync financial accounts and refresh balances.
//
// POST { action: "sync", organization_id, connection_id? }
//
// Owners and admins only. Reads each connection's PayPal balances and keeps
// one account per currency up to date. Without connection_id, every
// connection in the workspace is synced. One failing connection doesn't
// stop the others; its result carries the error instead.

import type { SupabaseClient } from "npm:@supabase/supabase-js@2.119.0";
import { requireOrgMember, requireUser } from "../_shared/auth.ts";
import { handleCors } from "../_shared/cors.ts";
import {
  type Connection,
  createAdminClient,
  findOrCreateCurrencyAccount,
  getConnection,
  listSyncableConnections,
  loadCredentials,
} from "../_shared/database.ts";
import { createPayPalClient, type PayPalCredentials } from "../_shared/paypal.ts";
import { errorResponse, HttpError, json } from "../_shared/response.ts";
import { optionalUuid, readJson, requireOneOf, requireUuid } from "../_shared/validation.ts";

type PayPalBalances = {
  balances?: {
    currency: string;
    total_balance?: { currency_code: string; value: string };
  }[];
};

type SyncResult =
  | { connection_id: string; status: "active"; accounts: number }
  | { connection_id: string; status: "error"; message: string };

async function syncConnection(
  client: SupabaseClient,
  admin: SupabaseClient,
  connection: Connection,
): Promise<SyncResult> {
  const markError = async (message: string): Promise<SyncResult> => {
    await client.from("connections").update({ status: "error" }).eq("id", connection.id);
    return { connection_id: connection.id, status: "error", message };
  };

  if (connection.provider !== "paypal") {
    return { connection_id: connection.id, status: "error", message: "Provider not supported." };
  }

  const creds = await loadCredentials<PayPalCredentials>(admin, connection.id);
  if (!creds) return markError("No credentials saved. Reconnect this account.");

  try {
    const paypal = createPayPalClient(creds);
    const result = await paypal.request<PayPalBalances>("/v1/reporting/balances");
    const now = new Date().toISOString();
    let updated = 0;

    for (const balance of result.balances ?? []) {
      if (!balance.total_balance) continue;

      const accountId = await findOrCreateCurrencyAccount(client, {
        organizationId: connection.organization_id,
        connectionId: connection.id,
        currency: balance.currency,
        namePrefix: "PayPal",
      });

      // The value is passed as text so the numeric column keeps full precision.
      const { error } = await client
        .from("accounts")
        .update({ balance: balance.total_balance.value, balance_updated_at: now })
        .eq("id", accountId);
      if (error) throw error;
      updated++;
    }

    const { error } = await client
      .from("connections")
      .update({ status: "active", last_synced_at: now })
      .eq("id", connection.id);
    if (error) throw error;

    return { connection_id: connection.id, status: "active", accounts: updated };
  } catch (error) {
    if (error instanceof HttpError) return markError(error.message);
    console.error("Account sync failed", connection.id, error);
    return markError("Sync failed.");
  }
}

Deno.serve(async (req) => {
  const preflight = handleCors(req);
  if (preflight) return preflight;

  try {
    if (req.method !== "POST") throw new HttpError(405, "Use POST.", "method_not_allowed");

    const body = await readJson(req);
    requireOneOf(body.action, "action", ["sync"] as const);
    const organizationId = requireUuid(body.organization_id, "organization_id");
    const connectionId = optionalUuid(body.connection_id, "connection_id");

    const auth = await requireUser(req);
    await requireOrgMember(auth, organizationId, ["owner", "admin"]);

    const connections = connectionId
      ? [await getConnection(auth.client, organizationId, connectionId)]
      : await listSyncableConnections(auth.client, organizationId);

    const admin = createAdminClient();
    const results: SyncResult[] = [];
    for (const connection of connections) {
      results.push(await syncConnection(auth.client, admin, connection));
    }

    return json(req, { results });
  } catch (error) {
    return errorResponse(req, error);
  }
});
