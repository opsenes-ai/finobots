// AI providers. All three expose an OpenAI-compatible chat completions API,
// so chat only needs a base URL, a key and a model. Base URLs are fixed here;
// users can't supply their own, which rules out server-side request forgery.

export type AiProviderName = "anthropic" | "openai" | "gemini";

export const AI_PROVIDERS = ["anthropic", "openai", "gemini"] as const;

const PROVIDER_CONFIG: Record<AiProviderName, { baseUrl: string; defaultModel: string }> = {
  anthropic: { baseUrl: "https://api.anthropic.com/v1", defaultModel: "claude-haiku-5-5" },
  openai: { baseUrl: "https://api.openai.com/v1", defaultModel: "gpt-5.4-nano" },
  gemini: {
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    defaultModel: "gemini-3.8-flash",
  },
};

// Model ids are sent to a fixed URL, so a format check is enough.
export const MODEL_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,99}$/;

export type AiTarget = {
  provider: AiProviderName | "platform";
  baseUrl: string;
  apiKey: string;
  model: string;
  // True when the workspace pays for its own usage.
  ownKey: boolean;
};

/** The shared default model, paid for by the platform. */
export function platformTarget(): AiTarget {
  const apiKey = Deno.env.get("AI_API_KEY");
  const model = Deno.env.get("AI_MODEL");
  if (!apiKey || !model) throw new Error("Missing AI_API_KEY or AI_MODEL");
  return {
    provider: "platform",
    baseUrl: (Deno.env.get("AI_BASE_URL") ?? PROVIDER_CONFIG.anthropic.baseUrl).replace(/\/$/, ""),
    apiKey,
    model,
    ownKey: false,
  };
}

export function providerTarget(
  provider: AiProviderName,
  apiKey: string,
  model: string | null,
): AiTarget {
  const config = PROVIDER_CONFIG[provider];
  return {
    provider,
    baseUrl: config.baseUrl,
    apiKey,
    model: model ?? config.defaultModel,
    ownKey: true,
  };
}

// Prices are USD per million tokens: [input, output]. Checked against public
// price lists in November 2026; update when providers change them.
const PRICES: Record<string, [number, number]> = {
  "claude-haiku-5-5": [0.1, 0.5],
  "gpt-5.4-nano": [0.2, 1.25],
  "gemini-3.8-flash": [0.75, 3.75],
};

// Models not listed above are costed at this rate, so limits err on the cautious side.
const FALLBACK_PRICE: [number, number] = [1, 5];

/** An estimate of what a reply cost, in USD. */
export function estimateCostUsd(model: string, inputTokens: number, outputTokens: number): number {
  const [input, output] = PRICES[model] ?? FALLBACK_PRICE;
  return (inputTokens * input + outputTokens * output) / 1_000_000;
}

// Credits cover the built-in model only. 100 credits is an internal budget of
// 5 USD, so one credit is 0.05 USD.
const CREDIT_USD = 0.05;

export function creditsFromUsd(usd: number): number {
  return usd / CREDIT_USD;
}

/** Sends a tiny request. Returns true if the provider accepts the key and model. */
export async function testTarget(target: AiTarget): Promise<boolean> {
  try {
    const response = await fetch(`${target.baseUrl}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${target.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: target.model,
        max_tokens: 16,
        messages: [{ role: "user", content: "Reply with OK." }],
      }),
      signal: AbortSignal.timeout(20_000),
    });
    // Drain the body so the connection is released.
    await response.body?.cancel();
    return response.ok;
  } catch {
    return false;
  }
}
