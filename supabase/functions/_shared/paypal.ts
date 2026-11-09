// PayPal REST API client.
//
// Secrets (set with `supabase secrets set`, never in the repo):
//   PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET
//   PAYPAL_ENV          "sandbox" (default) or "live"
//   PAYPAL_WEBHOOK_ID   for verifying webhook signatures

import { HttpError } from "./response.ts";

const BASE_URLS = {
  sandbox: "https://api-m.sandbox.paypal.com",
  live: "https://api-m.paypal.com",
} as const;

function env(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing environment variable ${name}`);
  return value;
}

function baseUrl(): string {
  return Deno.env.get("PAYPAL_ENV") === "live" ? BASE_URLS.live : BASE_URLS.sandbox;
}

// Reused while the function instance stays warm.
let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  // Refresh a minute early so a token never expires mid-request.
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.value;
  }

  const credentials = btoa(`${env("PAYPAL_CLIENT_ID")}:${env("PAYPAL_CLIENT_SECRET")}`);
  const res = await fetch(`${baseUrl()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    console.error("PayPal token request failed", res.status, await res.text());
    throw new HttpError(502, "Couldn't reach PayPal.", "paypal_unavailable");
  }

  const body = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    value: body.access_token,
    expiresAt: Date.now() + body.expires_in * 1000,
  };
  return cachedToken.value;
}

/** Calls a PayPal REST endpoint, e.g. paypalRequest("/v2/invoicing/invoices"). */
export async function paypalRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getAccessToken();
  const res = await fetch(`${baseUrl()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

  if (!res.ok) {
    console.error("PayPal request failed", path, res.status, await res.text());
    throw new HttpError(502, "PayPal request failed.", "paypal_error");
  }

  // Some endpoints return 204 No Content.
  return (res.status === 204 ? null : await res.json()) as T;
}

/**
 * Asks PayPal to confirm a webhook came from PayPal. Pass the parsed event
 * body. Reject the webhook unless this returns true.
 */
export async function verifyWebhookSignature(
  req: Request,
  event: unknown,
): Promise<boolean> {
  const header = (name: string) => req.headers.get(name) ?? "";

  const result = await paypalRequest<{ verification_status: string }>(
    "/v1/notifications/verify-webhook-signature",
    {
      method: "POST",
      body: JSON.stringify({
        auth_algo: header("paypal-auth-algo"),
        cert_url: header("paypal-cert-url"),
        transmission_id: header("paypal-transmission-id"),
        transmission_sig: header("paypal-transmission-sig"),
        transmission_time: header("paypal-transmission-time"),
        webhook_id: env("PAYPAL_WEBHOOK_ID"),
        webhook_event: event,
      }),
    },
  );

  return result.verification_status === "SUCCESS";
}
