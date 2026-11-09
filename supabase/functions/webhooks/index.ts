// Verify provider events and update records.
//
// PayPal posts events to:
//   https://<project>.supabase.co/functions/v1/webhooks?connection_id=<uuid>
// Each connection registers that URL in its PayPal app and saves the
// webhook id with its credentials. Every event is verified with PayPal
// before anything is written. JWT checks are off for this function in
// config.toml, because PayPal can't send a Supabase login.
//
// Handled: PAYMENT.CAPTURE.COMPLETED, .PENDING, .DENIED, .REVERSED, .REFUNDED.
// Other events are acknowledged and ignored, so PayPal doesn't retry them.

import {
  createAdminClient,
  findOrCreateCurrencyAccount,
  loadCredentials,
} from "../_shared/database.ts";
import { createPayPalClient, type PayPalCredentials } from "../_shared/paypal.ts";
import { errorResponse, HttpError, json } from "../_shared/response.ts";
import { requireUuid } from "../_shared/validation.ts";

type PayPalEvent = {
  id?: string;
  event_type?: string;
  resource?: {
    id?: string;
    status?: string;
    invoice_id?: string;
    create_time?: string;
    amount?: { currency_code: string; value: string };
  };
};

// Capture events and the transaction status each one sets.
const CAPTURE_STATUS: Record<string, string> = {
  "PAYMENT.CAPTURE.COMPLETED": "completed",
  "PAYMENT.CAPTURE.PENDING": "pending",
  "PAYMENT.CAPTURE.DENIED": "failed",
  "PAYMENT.CAPTURE.REVERSED": "refunded",
};

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") throw new HttpError(405, "Use POST.", "method_not_allowed");

    const connectionId = requireUuid(new URL(req.url).searchParams.get("connection_id"), "connection_id");

    let event: PayPalEvent;
    try {
      event = await req.json();
    } catch {
      throw new HttpError(400, "Invalid event body.", "invalid_input");
    }

    const admin = createAdminClient();
    const { data: connection, error } = await admin
      .from("connections")
      .select("id, organization_id, provider, status")
      .eq("id", connectionId)
      .maybeSingle<{ id: string; organization_id: string; provider: string; status: string }>();
    if (error) throw error;
    if (!connection || connection.provider !== "paypal" || connection.status === "disconnected") {
      throw new HttpError(404, "Unknown connection.", "not_found");
    }

    const creds = await loadCredentials<PayPalCredentials>(admin, connectionId);
    if (!creds?.webhookId) {
      throw new HttpError(400, "Webhooks aren't set up for this connection.", "webhook_not_configured");
    }

    const verified = await createPayPalClient(creds).verifyWebhookSignature(req, event);
    if (!verified) throw new HttpError(401, "Invalid webhook signature.", "invalid_signature");

    const type = event.event_type ?? "";
    const resource = event.resource;
    const isRefund = type === "PAYMENT.CAPTURE.REFUNDED";
    const status = isRefund ? "completed" : CAPTURE_STATUS[type];

    if (!status || !resource?.id || !resource.amount) {
      return json(req, { received: true, handled: false });
    }

    const accountId = await findOrCreateCurrencyAccount(admin, {
      organizationId: connection.organization_id,
      connectionId,
      currency: resource.amount.currency_code,
      namePrefix: "PayPal",
    });

    // Refunds are money going out, so they're stored as negative amounts.
    const value = resource.amount.value;
    const amount = isRefund && !value.startsWith("-") ? `-${value}` : value;

    // Upserting by PayPal's id makes repeated deliveries safe. category and
    // metadata are left out so user edits are kept.
    const { error: upsertError } = await admin.from("transactions").upsert(
      {
        organization_id: connection.organization_id,
        account_id: accountId,
        external_id: resource.id,
        amount,
        currency: resource.amount.currency_code,
        status,
        description: isRefund
          ? "PayPal refund"
          : resource.invoice_id
            ? `Invoice ${resource.invoice_id}`
            : "PayPal payment",
        occurred_at: resource.create_time ?? new Date().toISOString(),
      },
      { onConflict: "account_id,external_id" },
    );
    if (upsertError) throw upsertError;

    return json(req, { received: true, handled: true });
  } catch (error) {
    return errorResponse(req, error);
  }
});
