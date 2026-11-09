// Connect providers and manage credentials securely.
//
// POST { action, organization_id, ... }
//   connect     provider, name, environment, client_id, client_secret, webhook_id?
//   rotate      connection_id, client_id, client_secret, environment?, webhook_id?
//   test        connection_id
//   disconnect  connection_id
//
// Owners and admins only. Secrets are verified with PayPal, encrypted, and
// stored where only server code can read them. They are never returned.

import { requireOrgMember, requireUser } from "../_shared/auth.ts";
import { handleCors } from "../_shared/cors.ts";
import {
  createAdminClient,
  deleteCredentials,
  getConnection,
  loadCredentials,
  saveCredentials,
} from "../_shared/database.ts";
import { createPayPalClient, type PayPalCredentials } from "../_shared/paypal.ts";
import { errorResponse, HttpError, json } from "../_shared/response.ts";
import {
  optionalString,
  readJson,
  requireOneOf,
  requireString,
  requireUuid,
} from "../_shared/validation.ts";

const ACTIONS = ["connect", "rotate", "test", "disconnect"] as const;
const ENVIRONMENTS = ["sandbox", "live"] as const;

function readCredentials(
  body: Record<string, unknown>,
  fallback?: PayPalCredentials,
): PayPalCredentials {
  const environment =
    body.environment === undefined && fallback
      ? fallback.environment
      : requireOneOf(body.environment, "environment", ENVIRONMENTS);
  const webhookId =
    body.webhook_id === undefined
      ? fallback?.webhookId
      : optionalString(body.webhook_id, "webhook_id", { max: 200 });

  return {
    clientId: requireString(body.client_id, "client_id", { max: 200 }),
    clientSecret: requireString(body.client_secret, "client_secret", { max: 200 }),
    environment,
    webhookId,
  };
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
    await requireOrgMember(auth, organizationId, ["owner", "admin"]);
    const admin = createAdminClient();

    switch (action) {
      case "connect": {
        const provider = requireOneOf(body.provider, "provider", ["paypal", "venmo"] as const);
        if (provider !== "paypal") {
          throw new HttpError(400, "Venmo isn't supported yet.", "unsupported_provider");
        }
        const name = requireString(body.name, "name", { max: 100 });
        const creds = readCredentials(body);

        // Fails with a clear message if PayPal rejects the credentials.
        await createPayPalClient(creds).verifyCredentials();

        const { data: connection, error } = await auth.client
          .from("connections")
          .insert({
            organization_id: organizationId,
            provider,
            name,
            status: "active",
            created_by: auth.userId,
            metadata: { environment: creds.environment },
          })
          .select("id, provider, name, status, created_at")
          .single();
        if (error) throw error;

        try {
          await saveCredentials(admin, connection.id, creds);
        } catch (saveError) {
          // Don't leave a connection behind that has no credentials.
          await auth.client.from("connections").delete().eq("id", connection.id);
          throw saveError;
        }

        return json(req, { connection }, 201);
      }

      case "rotate": {
        const connectionId = requireUuid(body.connection_id, "connection_id");
        await getConnection(auth.client, organizationId, connectionId);

        const existing = await loadCredentials<PayPalCredentials>(admin, connectionId);
        const creds = readCredentials(body, existing ?? undefined);
        await createPayPalClient(creds).verifyCredentials();
        await saveCredentials(admin, connectionId, creds);

        const { error } = await auth.client
          .from("connections")
          .update({ status: "active", metadata: { environment: creds.environment } })
          .eq("id", connectionId);
        if (error) throw error;

        return json(req, { connection_id: connectionId, status: "active" });
      }

      case "test": {
        const connectionId = requireUuid(body.connection_id, "connection_id");
        await getConnection(auth.client, organizationId, connectionId);

        const creds = await loadCredentials<PayPalCredentials>(admin, connectionId);
        let status: "active" | "error" = "error";
        if (creds) {
          try {
            await createPayPalClient(creds).verifyCredentials();
            status = "active";
          } catch (testError) {
            if (!(testError instanceof HttpError)) throw testError;
          }
        }

        const { error } = await auth.client
          .from("connections")
          .update({ status })
          .eq("id", connectionId);
        if (error) throw error;

        return json(req, { connection_id: connectionId, status });
      }

      case "disconnect": {
        const connectionId = requireUuid(body.connection_id, "connection_id");
        await getConnection(auth.client, organizationId, connectionId);

        await deleteCredentials(admin, connectionId);
        const { error } = await auth.client
          .from("connections")
          .update({ status: "disconnected" })
          .eq("id", connectionId);
        if (error) throw error;

        return json(req, { connection_id: connectionId, status: "disconnected" });
      }
    }
  } catch (error) {
    return errorResponse(req, error);
  }
});
