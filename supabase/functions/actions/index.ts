// Check permissions and approvals, then execute financial actions.
//
// POST {
//   organization_id, connection_id,
//   action: "send_invoice" | "send_reminder",
//   invoice_id, subject?, note?,
//   approved: true
// }
//
// Owners and admins only. Nothing runs unless the request carries
// approved: true, which the app should only send after the user confirms
// the action. There's no stored approval record yet, so this flag is the
// approval check.

import { requireOrgMember, requireUser } from "../_shared/auth.ts";
import { handleCors } from "../_shared/cors.ts";
import { createAdminClient, getConnection, loadCredentials } from "../_shared/database.ts";
import { createPayPalClient, type PayPalCredentials } from "../_shared/paypal.ts";
import { errorResponse, HttpError, json } from "../_shared/response.ts";
import {
  optionalString,
  readJson,
  requireOneOf,
  requireString,
  requireUuid,
} from "../_shared/validation.ts";

const ACTIONS = ["send_invoice", "send_reminder"] as const;
const PATHS: Record<(typeof ACTIONS)[number], string> = {
  send_invoice: "send",
  send_reminder: "remind",
};
const INVOICE_ID = /^[A-Za-z0-9-]{1,64}$/;

Deno.serve(async (req) => {
  const preflight = handleCors(req);
  if (preflight) return preflight;

  try {
    if (req.method !== "POST") throw new HttpError(405, "Use POST.", "method_not_allowed");

    const body = await readJson(req);
    const action = requireOneOf(body.action, "action", ACTIONS);
    const organizationId = requireUuid(body.organization_id, "organization_id");
    const connectionId = requireUuid(body.connection_id, "connection_id");
    const invoiceId = requireString(body.invoice_id, "invoice_id", { max: 64 });
    if (!INVOICE_ID.test(invoiceId)) {
      throw new HttpError(400, "invoice_id isn't a valid PayPal invoice id.", "invalid_input");
    }
    const subject = optionalString(body.subject, "subject", { max: 200 });
    const note = optionalString(body.note, "note", { max: 4000 });

    if (body.approved !== true) {
      throw new HttpError(400, "This action needs your approval before it runs.", "approval_required");
    }

    const auth = await requireUser(req);
    await requireOrgMember(auth, organizationId, ["owner", "admin"]);

    const connection = await getConnection(auth.client, organizationId, connectionId);
    if (connection.provider !== "paypal" || connection.status !== "active") {
      throw new HttpError(400, "This connection isn't active.", "connection_inactive");
    }

    const creds = await loadCredentials<PayPalCredentials>(createAdminClient(), connectionId);
    if (!creds) throw new HttpError(400, "No credentials saved. Reconnect this account.", "no_credentials");

    await createPayPalClient(creds).request(
      `/v2/invoicing/invoices/${encodeURIComponent(invoiceId)}/${PATHS[action]}`,
      { method: "POST", body: { subject, note, send_to_recipient: true } },
    );

    // Audit trail in the function logs until an actions table exists.
    console.log("Action executed", {
      action,
      organization_id: organizationId,
      connection_id: connectionId,
      invoice_id: invoiceId,
      user_id: auth.userId,
    });

    return json(req, { action, invoice_id: invoiceId, status: "sent" });
  } catch (error) {
    return errorResponse(req, error);
  }
});
