import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.119.0";
import { HttpError } from "./response.ts";

function env(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing environment variable ${name}`);
  return value;
}

/**
 * A client that acts as the signed-in user, using the request's
 * Authorization header. Row level security applies to every query.
 * Use this by default.
 */
export function createUserClient(req: Request) {
  const authorization = req.headers.get("Authorization");
  if (!authorization) {
    throw new HttpError(401, "You need to sign in.", "unauthorized");
  }

  return createClient(env("SUPABASE_URL"), env("SUPABASE_ANON_KEY"), {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * A service-role client that bypasses row level security. Only for work
 * no user can do directly, such as reading connection_credentials or
 * handling webhooks. Check access yourself before using it for a user.
 */
export function createAdminClient() {
  return createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// ---------------------------------------------------------------------------
// Connections
// ---------------------------------------------------------------------------

export type Connection = {
  id: string;
  organization_id: string;
  provider: "paypal" | "venmo";
  name: string;
  status: "pending" | "active" | "error" | "disconnected";
};

const CONNECTION_COLUMNS = "id, organization_id, provider, name, status";

/** One connection in the organization, any status. 404 if not found. */
export async function getConnection(
  client: SupabaseClient,
  organizationId: string,
  connectionId: string,
): Promise<Connection> {
  const { data, error } = await client
    .from("connections")
    .select(CONNECTION_COLUMNS)
    .eq("organization_id", organizationId)
    .eq("id", connectionId)
    .maybeSingle<Connection>();

  if (error) throw error;
  if (!data) throw new HttpError(404, "Connection not found.", "not_found");
  return data;
}

/** Connections that can be synced: not disconnected. */
export async function listSyncableConnections(
  client: SupabaseClient,
  organizationId: string,
): Promise<Connection[]> {
  const { data, error } = await client
    .from("connections")
    .select(CONNECTION_COLUMNS)
    .eq("organization_id", organizationId)
    .neq("status", "disconnected")
    .returns<Connection[]>();

  if (error) throw error;
  return data ?? [];
}

// ---------------------------------------------------------------------------
// Accounts
// ---------------------------------------------------------------------------

/**
 * The account holding a connection's balance in one currency, created on
 * first use. Uses external_id "balance-<CURRENCY>".
 */
export async function findOrCreateCurrencyAccount(
  client: SupabaseClient,
  input: {
    organizationId: string;
    connectionId: string;
    currency: string;
    namePrefix: string;
  },
): Promise<string> {
  const externalId = `balance-${input.currency}`;

  const find = async () => {
    const { data, error } = await client
      .from("accounts")
      .select("id")
      .eq("connection_id", input.connectionId)
      .eq("external_id", externalId)
      .maybeSingle<{ id: string }>();
    if (error) throw error;
    return data?.id ?? null;
  };

  const existing = await find();
  if (existing) return existing;

  const { data, error } = await client
    .from("accounts")
    .insert({
      organization_id: input.organizationId,
      connection_id: input.connectionId,
      name: `${input.namePrefix} ${input.currency}`,
      type: "wallet",
      external_id: externalId,
      currency: input.currency,
    })
    .select("id")
    .single<{ id: string }>();

  if (!error) return data.id;

  // Another request created it at the same time; use that one.
  if (error.code === "23505") {
    const created = await find();
    if (created) return created;
  }
  throw error;
}

// ---------------------------------------------------------------------------
// Encrypted credentials
//
// connection_credentials is only reachable with the service role. Values are
// also encrypted with AES-GCM, using CREDENTIALS_ENCRYPTION_KEY (32 random
// bytes, base64). The connection id is bound to each ciphertext, so stored
// credentials can't be copied onto another connection.
// ---------------------------------------------------------------------------

const encoder = new TextEncoder();
const decoder = new TextDecoder();
let keyPromise: Promise<CryptoKey> | null = null;

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

// Backed by a plain ArrayBuffer, which the Web Crypto API requires.
function fromBase64(text: string): Uint8Array<ArrayBuffer> {
  const binary = atob(text);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function credentialsKey(): Promise<CryptoKey> {
  keyPromise ??= (async () => {
    const raw = fromBase64(env("CREDENTIALS_ENCRYPTION_KEY"));
    if (raw.length !== 32) {
      throw new Error("CREDENTIALS_ENCRYPTION_KEY must be 32 bytes, base64-encoded");
    }
    return crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt", "decrypt"]);
  })();
  return keyPromise;
}

type EncryptedSecrets = { v: 1; iv: string; data: string };

export async function saveCredentials(
  admin: SupabaseClient,
  connectionId: string,
  secrets: Record<string, unknown>,
): Promise<void> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, additionalData: encoder.encode(connectionId) },
    await credentialsKey(),
    encoder.encode(JSON.stringify(secrets)),
  );

  const stored: EncryptedSecrets = {
    v: 1,
    iv: toBase64(iv),
    data: toBase64(new Uint8Array(ciphertext)),
  };

  const { error } = await admin
    .from("connection_credentials")
    .upsert({ connection_id: connectionId, secrets: stored });
  if (error) throw error;
}

export async function loadCredentials<T>(
  admin: SupabaseClient,
  connectionId: string,
): Promise<T | null> {
  const { data, error } = await admin
    .from("connection_credentials")
    .select("secrets")
    .eq("connection_id", connectionId)
    .maybeSingle<{ secrets: EncryptedSecrets }>();

  if (error) throw error;
  if (!data) return null;
  if (data.secrets?.v !== 1) throw new Error("Unsupported credentials format");

  const plaintext = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: fromBase64(data.secrets.iv),
      additionalData: encoder.encode(connectionId),
    },
    await credentialsKey(),
    fromBase64(data.secrets.data),
  );

  return JSON.parse(decoder.decode(plaintext)) as T;
}

// ---------------------------------------------------------------------------
// AI provider keys. Encrypted the same way, with the ai_providers id bound to
// each ciphertext. Stored in ai_provider_secrets (service role only).
// ---------------------------------------------------------------------------

export async function saveAiKey(
  admin: SupabaseClient,
  aiProviderId: string,
  apiKey: string,
): Promise<void> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, additionalData: encoder.encode(aiProviderId) },
    await credentialsKey(),
    encoder.encode(apiKey),
  );

  const stored: EncryptedSecrets = {
    v: 1,
    iv: toBase64(iv),
    data: toBase64(new Uint8Array(ciphertext)),
  };

  const { error } = await admin
    .from("ai_provider_secrets")
    .upsert({ ai_provider_id: aiProviderId, secrets: stored });
  if (error) throw error;
}

export async function loadAiKey(
  admin: SupabaseClient,
  aiProviderId: string,
): Promise<string | null> {
  const { data, error } = await admin
    .from("ai_provider_secrets")
    .select("secrets")
    .eq("ai_provider_id", aiProviderId)
    .maybeSingle<{ secrets: EncryptedSecrets }>();

  if (error) throw error;
  if (!data) return null;
  if (data.secrets?.v !== 1) throw new Error("Unsupported key format");

  const plaintext = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: fromBase64(data.secrets.iv),
      additionalData: encoder.encode(aiProviderId),
    },
    await credentialsKey(),
    fromBase64(data.secrets.data),
  );

  return decoder.decode(plaintext);
}

export async function deleteCredentials(
  admin: SupabaseClient,
  connectionId: string,
): Promise<void> {
  const { error } = await admin
    .from("connection_credentials")
    .delete()
    .eq("connection_id", connectionId);
  if (error) throw error;
}
