// Import, categorise, and reconcile transactions.
//
// POST { action, organization_id, ... }
//   import      connection_id, start?, end?   Owners and admins. At most 31 days.
//   categorise  transaction_ids, category      Any member. category null clears it.
//   reconcile   transaction_ids, reference?    Any member.

import type { SupabaseClient } from "npm:@supabase/supabase-js@2.119.0";
import { requireOrgMember, requireUser } from "../_shared/auth.ts";
import { handleCors } from "../_shared/cors.ts";
import {
  createAdminClient,
  findOrCreateCurrencyAccount,
  getConnection,
  loadCredentials,
} from "../_shared/database.ts";
import { createPayPalClient, type PayPalCredentials } from "../_shared/paypal.ts";
import { errorResponse, HttpError, json } from "../_shared/response.ts";
import {
  optionalDate,
  optionalString,
  readJson,
  requireArray,
  requireOneOf,
  requireUuid,
} from "../_shared/validation.ts";

const ACTIONS = ["import", "categorise", "reconcile"] as const;
const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_IMPORT_DAYS = 31; // PayPal's limit per request.

// PayPal transaction_status codes.
const STATUS: Record<string, string> = {
  S: "completed",
  P: "pending",
  D: "failed",
  V: "refunded",
};

type PayPalTransactions = {
  total_pages?: number;
  transaction_details?: {
    transaction_info?: {
      transaction_id?: string;
      transaction_status?: string;
      transaction_initiation_date?: string;
      transaction_subject?: string;
      transaction_note?: string;
      transaction_event_code?: string;
      transaction_amount?: { currency_code: string; value: string };
    };
    payer_info?: {
      email_address?: string;
      payer_name?: { alternate_full_name?: string };
    };
  }[];
};

// PayPal expects ISO 8601 without milliseconds.
function paypalDate(date: Date): string {
  return date.toISOString().replace(/\.\d{3}Z$/, "Z");
}

function readTransactionIds(body: Record<string, unknown>): string[] {
  return requireArray(body.transaction_ids, "transaction_ids", { max: 200 }).map((id, i) =>
    requireUuid(id, `transaction_ids[${i}]`)
  );
}

async function importTransactions(
  client: SupabaseClient,
  organizationId: string,
  body: Record<string, unknown>,
) {
  const connectionId = requireUuid(body.connection_id, "connection_id");
  const end = optionalDate(body.end, "end") ?? new Date();
  const start = optionalDate(body.start, "start") ?? new Date(end.getTime() - 30 * DAY_MS);

  if (start >= end) throw new HttpError(400, "start must be before end.", "invalid_input");
  if (end.getTime() - start.getTime() > MAX_IMPORT_DAYS * DAY_MS) {
    throw new HttpError(400, `Import at most ${MAX_IMPORT_DAYS} days at a time.`, "invalid_input");
  }

  const connection = await getConnection(client, organizationId, connectionId);
  if (connection.provider !== "paypal") {
    throw new HttpError(400, "Provider not supported.", "unsupported_provider");
  }

  const creds = await loadCredentials<PayPalCredentials>(createAdminClient(), connectionId);
  if (!creds) throw new HttpError(400, "No credentials saved. Reconnect this account.", "no_credentials");

  const paypal = createPayPalClient(creds);
  const accountIds = new Map<string, string>();
  const rows: Record<string, unknown>[] = [];

  for (let page = 1, totalPages = 1; page <= totalPages; page++) {
    const query = new URLSearchParams({
      start_date: paypalDate(start),
      end_date: paypalDate(end),
      fields: "transaction_info,payer_info",
      page_size: "500",
      page: String(page),
    });
    const result = await paypal.request<PayPalTransactions>(`/v1/reporting/transactions?${query}`);
    totalPages = result.total_pages ?? 1;

    for (const detail of result.transaction_details ?? []) {
      const info = detail.transaction_info;
      const amount = info?.transaction_amount;
      if (!info?.transaction_id || !amount) continue;

      let accountId = accountIds.get(amount.currency_code);
      if (!accountId) {
        accountId = await findOrCreateCurrencyAccount(client, {
          organizationId,
          connectionId,
          currency: amount.currency_code,
          namePrefix: "PayPal",
        });
        accountIds.set(amount.currency_code, accountId);
      }

      // category and metadata are left out, so a re-import keeps the
      // user's categories and reconciliation.
      rows.push({
        organization_id: organizationId,
        account_id: accountId,
        external_id: info.transaction_id,
        amount: amount.value, // Signed by PayPal: negative is money out.
        currency: amount.currency_code,
        status: STATUS[info.transaction_status ?? ""] ?? "pending",
        description:
          info.transaction_subject || info.transaction_note || info.transaction_event_code || null,
        counterparty:
          detail.payer_info?.payer_name?.alternate_full_name ||
          detail.payer_info?.email_address ||
          null,
        occurred_at: info.transaction_initiation_date ?? new Date().toISOString(),
      });
    }
  }

  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await client
      .from("transactions")
      .upsert(rows.slice(i, i + 500), { onConflict: "account_id,external_id" });
    if (error) throw error;
  }

  const { error } = await client
    .from("connections")
    .update({ last_synced_at: new Date().toISOString() })
    .eq("id", connectionId);
  if (error) throw error;

  return { imported: rows.length, start: start.toISOString(), end: end.toISOString() };
}

Deno.serve(async (req) => {
  const preflight = handleCors(req);
  if (preflight) return preflight;

  try {
    if (req.method !== "POST") throw new HttpError(405, "Use POST.", "method_not_allowed");

    const body = await readJson(req);
    const action = requireOneOf(body.action, "action", ACTIONS);
    const organizationId = requireUuid(body.organization_id, "organization_id");
    const auth = await requireUser(req);

    switch (action) {
      case "import": {
        await requireOrgMember(auth, organizationId, ["owner", "admin"]);
        return json(req, await importTransactions(auth.client, organizationId, body));
      }

      case "categorise": {
        await requireOrgMember(auth, organizationId);
        const ids = readTransactionIds(body);
        const category =
          body.category === null ? null : optionalString(body.category, "category", { max: 60 });
        if (category === undefined) {
          throw new HttpError(400, "category is required (or null to clear it).", "invalid_input");
        }

        const { data, error } = await auth.client
          .from("transactions")
          .update({ category })
          .eq("organization_id", organizationId)
          .in("id", ids)
          .select("id");
        if (error) throw error;

        return json(req, { updated: data?.length ?? 0 });
      }

      case "reconcile": {
        await requireOrgMember(auth, organizationId);
        const ids = readTransactionIds(body);
        const reference = optionalString(body.reference, "reference", { max: 200 });

        const { data: transactions, error } = await auth.client
          .from("transactions")
          .select("id, metadata")
          .eq("organization_id", organizationId)
          .in("id", ids)
          .returns<{ id: string; metadata: Record<string, unknown> | null }[]>();
        if (error) throw error;

        const reconciled = {
          at: new Date().toISOString(),
          by: auth.userId,
          reference: reference ?? null,
        };
        for (const transaction of transactions ?? []) {
          const { error: updateError } = await auth.client
            .from("transactions")
            .update({ metadata: { ...(transaction.metadata ?? {}), reconciled } })
            .eq("id", transaction.id);
          if (updateError) throw updateError;
        }

        return json(req, { reconciled: transactions?.length ?? 0 });
      }
    }
  } catch (error) {
    return errorResponse(req, error);
  }
});
