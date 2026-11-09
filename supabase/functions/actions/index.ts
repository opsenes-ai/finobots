// Check permissions and approvals, then execute financial actions.
//
// POST { action_id, decision: "approve" | "reject", connection_id? }
//
// action_id is a row in agent_actions with status "proposed" (or "approved"
// but not yet run, to retry after an interruption). Owners and admins only.
// The workspace comes from the stored action, never from the request.
//
//   reject   proposed -> rejected
//   approve  proposed -> approved, then runs it -> executed | failed
//
// Each action runs at most once: it is claimed before PayPal is called, so
// two approvals at the same time can't send the same invoice twice. A failed
// action isn't retried; the agent proposes a new one.

import { requireOrgMember, requireUser } from "../_shared/auth.ts";
import { handleCors } from "../_shared/cors.ts";
import { createAdminClient, getConnection, loadCredentials } from "../_shared/database.ts";
import { createPayPalClient, type PayPalCredentials } from "../_shared/paypal.ts";
import { errorResponse, HttpError, json } from "../_shared/response.ts";
import {
  optionalString,
  optionalUuid,
  readJson,
  requireOneOf,
  requireUuid,
} from "../_shared/validation.ts";

type ActionType = "send_invoice" | "send_reminder";

type AgentAction = {
  id: string;
  organization_id: string;
  connection_id: string | null;
  type: ActionType;
  payload: Record<string, unknown> | null;
  status: "proposed" | "approved" | "rejected" | "executed" | "failed";
  executed_at: string | null;
};

const PAYPAL_PATHS: Record<ActionType, string> = {
  send_invoice: "send",
  send_reminder: "remind",
};
const INVOICE_ID = /^[A-Za-z0-9-]{1,64}$/;

function conflict(message: string): never {
  throw new HttpError(409, message, "conflict");
}

// Payloads are written by members when an action is proposed, so they're
// validated again here before anything runs.
function readPayload(payload: Record<string, unknown> | null) {
  const invoiceId = payload?.invoice_id;
  if (typeof invoiceId !== "string" || !INVOICE_ID.test(invoiceId)) {
    throw new HttpError(400, "This action doesn't have a valid invoice id.", "invalid_action");
  }
  return {
    invoiceId,
    subject: optionalString(payload?.subject, "subject", { max: 200 }),
    note: optionalString(payload?.note, "note", { max: 4000 }),
  };
}

Deno.serve(async (req) => {
  const preflight = handleCors(req);
  if (preflight) return preflight;

  try {
    if (req.method !== "POST") throw new HttpError(405, "Use POST.", "method_not_allowed");

    const body = await readJson(req);
    const actionId = requireUuid(body.action_id, "action_id");
    const decision = requireOneOf(body.decision, "decision", ["approve", "reject"] as const);
    const requestedConnectionId = optionalUuid(body.connection_id, "connection_id");

    const auth = await requireUser(req);

    // Row level security only returns actions from the user's own workspace.
    const { data: action, error: loadError } = await auth.client
      .from("agent_actions")
      .select("id, organization_id, connection_id, type, payload, status, executed_at")
      .eq("id", actionId)
      .maybeSingle<AgentAction>();
    if (loadError) throw loadError;
    if (!action) throw new HttpError(404, "Action not found.", "not_found");

    await requireOrgMember(auth, action.organization_id, ["owner", "admin"]);
    const decidedAt = new Date().toISOString();

    // Records the decision as the user. The update policy only allows moving
    // a proposed action to approved or rejected.
    const decide = async (status: "approved" | "rejected") => {
      const { data, error } = await auth.client
        .from("agent_actions")
        .update({ status, decided_by: auth.userId, decided_at: decidedAt })
        .eq("id", action.id)
        .eq("status", "proposed")
        .select("id")
        .maybeSingle();
      if (error) throw error;
      if (!data) conflict("This action was already decided.");
    };

    if (decision === "reject") {
      if (action.status !== "proposed") conflict(`This action was already ${action.status}.`);
      await decide("rejected");
      return json(req, { action_id: action.id, status: "rejected" });
    }

    // Approve: check everything that can fail before recording the approval.
    if (action.status === "approved" && action.executed_at) {
      conflict("This action has already run.");
    }
    if (action.status !== "proposed" && action.status !== "approved") {
      conflict(`This action was already ${action.status}.`);
    }

    const { invoiceId, subject, note } = readPayload(action.payload);

    const connectionId = action.connection_id ?? requestedConnectionId;
    if (!connectionId) {
      throw new HttpError(400, "Choose the PayPal connection to use.", "connection_required");
    }
    const connection = await getConnection(auth.client, action.organization_id, connectionId);
    if (connection.provider !== "paypal" || connection.status !== "active") {
      throw new HttpError(400, "This connection isn't active.", "connection_inactive");
    }

    const admin = createAdminClient();
    const creds = await loadCredentials<PayPalCredentials>(admin, connectionId);
    if (!creds) throw new HttpError(400, "No credentials saved. Reconnect this account.", "no_credentials");

    if (action.status === "proposed") await decide("approved");

    // Claim the action. Only one request can set executed_at, so it runs once.
    const { data: claimed, error: claimError } = await admin
      .from("agent_actions")
      .update({ executed_at: new Date().toISOString(), connection_id: connectionId })
      .eq("id", action.id)
      .eq("status", "approved")
      .is("executed_at", null)
      .select("id")
      .maybeSingle();
    if (claimError) throw claimError;
    if (!claimed) conflict("This action is already running or has run.");

    try {
      await createPayPalClient(creds).request(
        `/v2/invoicing/invoices/${encodeURIComponent(invoiceId)}/${PAYPAL_PATHS[action.type]}`,
        { method: "POST", body: { subject, note, send_to_recipient: true } },
      );
    } catch (runError) {
      const message = runError instanceof HttpError ? runError.message : "The action failed.";
      await admin
        .from("agent_actions")
        .update({ status: "failed", result: { error: message } })
        .eq("id", action.id);
      throw runError;
    }

    const { error: doneError } = await admin
      .from("agent_actions")
      .update({ status: "executed", result: { sent: true, invoice_id: invoiceId } })
      .eq("id", action.id);
    if (doneError) throw doneError;

    return json(req, { action_id: action.id, status: "executed" });
  } catch (error) {
    return errorResponse(req, error);
  }
});
