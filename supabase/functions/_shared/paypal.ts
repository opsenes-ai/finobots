// PayPal REST API client.
//
// Each workspace connects its own PayPal REST app. Its credentials are
// stored encrypted per connection (see database.ts) and passed in here,
// so one workspace can never act on another's PayPal account.

import { HttpError } from "./response.ts";

export type PayPalEnvironment = "sandbox" | "live";

export type PayPalCredentials = {
  clientId: string;
  clientSecret: string;
  environment: PayPalEnvironment;
  /** From the PayPal developer dashboard; needed to verify webhooks. */
  webhookId?: string;
};

const BASE_URLS: Record<PayPalEnvironment, string> = {
  sandbox: "https://api-m.sandbox.paypal.com",
  live: "https://api-m.paypal.com",
};

// Reused while the function instance stays warm, keyed per PayPal app.
const tokens = new Map<string, { value: string; expiresAt: number }>();

async function getAccessToken(creds: PayPalCredentials): Promise<string> {
  const key = `${creds.environment}:${creds.clientId}`;
  const cached = tokens.get(key);
  // Refresh a minute early so a token never expires mid-request.
  if (cached && Date.now() < cached.expiresAt - 60_000) return cached.value;

  const res = await fetch(`${BASE_URLS[creds.environment]}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${creds.clientId}:${creds.clientSecret}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (res.status === 401) {
    throw new HttpError(400, "PayPal rejected these credentials.", "paypal_invalid_credentials");
  }
  if (!res.ok) {
    console.error("PayPal token request failed", res.status, await res.text());
    throw new HttpError(502, "Couldn't reach PayPal.", "paypal_unavailable");
  }

  const body = (await res.json()) as { access_token: string; expires_in: number };
  tokens.set(key, {
    value: body.access_token,
    expiresAt: Date.now() + body.expires_in * 1000,
  });
  return body.access_token;
}

export function createPayPalClient(creds: PayPalCredentials) {
  const baseUrl = BASE_URLS[creds.environment];

  /** Calls a PayPal REST endpoint, e.g. request("/v1/reporting/balances"). */
  async function request<T>(
    path: string,
    init: { method?: string; body?: unknown } = {},
  ): Promise<T> {
    const token = await getAccessToken(creds);
    const res = await fetch(`${baseUrl}${path}`, {
      method: init.method ?? "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });

    if (!res.ok) {
      console.error("PayPal request failed", path, res.status, await res.text());
      if (res.status === 404) {
        throw new HttpError(404, "PayPal couldn't find that record.", "paypal_not_found");
      }
      if (res.status === 401 || res.status === 403) {
        throw new HttpError(
          400,
          "PayPal denied access. Check the app's permissions.",
          "paypal_forbidden",
        );
      }
      if (res.status >= 400 && res.status < 500) {
        throw new HttpError(400, "PayPal couldn't complete this request.", "paypal_rejected");
      }
      throw new HttpError(502, "PayPal request failed.", "paypal_error");
    }

    // Some endpoints return 204 No Content.
    return (res.status === 204 ? null : await res.json()) as T;
  }

  /** Confirms the credentials work by requesting an access token. */
  async function verifyCredentials(): Promise<void> {
    await getAccessToken(creds);
  }

  /**
   * Asks PayPal to confirm a webhook came from PayPal. Pass the parsed event
   * body. Reject the webhook unless this returns true.
   */
  async function verifyWebhookSignature(req: Request, event: unknown): Promise<boolean> {
    if (!creds.webhookId) return false;
    const header = (name: string) => req.headers.get(name) ?? "";

    const result = await request<{ verification_status: string }>(
      "/v1/notifications/verify-webhook-signature",
      {
        method: "POST",
        body: {
          auth_algo: header("paypal-auth-algo"),
          cert_url: header("paypal-cert-url"),
          transmission_id: header("paypal-transmission-id"),
          transmission_sig: header("paypal-transmission-sig"),
          transmission_time: header("paypal-transmission-time"),
          webhook_id: creds.webhookId,
          webhook_event: event,
        },
      },
    );

    return result.verification_status === "SUCCESS";
  }

  return { request, verifyCredentials, verifyWebhookSignature };
}
