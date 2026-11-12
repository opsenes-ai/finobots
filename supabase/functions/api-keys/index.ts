// Create API keys.
//
// POST { organization_id, name, scopes: string[] }
//
// Owners and admins only. The key is returned once. Only a SHA-256 hash is
// stored, so it can't be shown again. Revoking is done from the app by
// setting revoked_at on the key.

import { requireOrgMember, requireUser } from "../_shared/auth.ts";
import { handleCors } from "../_shared/cors.ts";
import { createAdminClient } from "../_shared/database.ts";
import { errorResponse, HttpError, json } from "../_shared/response.ts";
import { readJson, requireArray, requireString, requireUuid } from "../_shared/validation.ts";

const SCOPES = [
  "accounts:read",
  "transactions:read",
  "transactions:write",
  "cashflow:read",
  "connections:read",
] as const;

const MAX_ACTIVE_KEYS = 10;

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  const preflight = handleCors(req);
  if (preflight) return preflight;

  try {
    if (req.method !== "POST") throw new HttpError(405, "Use POST.", "method_not_allowed");

    const body = await readJson(req);
    const organizationId = requireUuid(body.organization_id, "organization_id");
    const name = requireString(body.name, "name", { max: 100 });
    const scopes = requireArray(body.scopes, "scopes", { min: 1, max: SCOPES.length }).map(
      (scope, i) => {
        if (typeof scope !== "string" || !(SCOPES as readonly string[]).includes(scope)) {
          throw new HttpError(400, `scopes[${i}] isn't a valid scope.`, "invalid_input");
        }
        return scope;
      },
    );

    const auth = await requireUser(req);
    await requireOrgMember(auth, organizationId, ["owner", "admin"]);

    const { count, error: countError } = await auth.client
      .from("api_keys")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .is("revoked_at", null);
    if (countError) throw countError;
    if ((count ?? 0) >= MAX_ACTIVE_KEYS) {
      throw new HttpError(400, `You can have up to ${MAX_ACTIVE_KEYS} active keys. Revoke one first.`, "limit_reached");
    }

    const key = `fbk_${toBase64Url(crypto.getRandomValues(new Uint8Array(32)))}`;

    const { data, error } = await createAdminClient()
      .from("api_keys")
      .insert({
        organization_id: organizationId,
        name,
        prefix: key.slice(0, 8),
        key_hash: await sha256Hex(key),
        scopes: [...new Set(scopes)],
        created_by: auth.userId,
      })
      .select("id, name, prefix, scopes, created_at")
      .single();
    if (error) throw error;

    return json(req, { api_key: data, key }, 201);
  } catch (error) {
    return errorResponse(req, error);
  }
});
