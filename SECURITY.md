# Security Policy

## Supported versions

| Version | Supported |
| --- | --- |
| 0.1.x and `main` | Yes |
| < 0.1 | No |

## Reporting a vulnerability

1. **Don't** open a public GitHub issue.
2. Email **security@finobots.com** with a description, steps to reproduce and the potential impact.
3. Include any relevant code, screenshots or proof of concept.

### Response timeline

| Step | Expected timeframe |
| --- | --- |
| Acknowledgement | Within 48 hours |
| Initial assessment | Within 5 business days |
| Fix or mitigation | Within 30 days, depending on severity |
| Public disclosure | After the fix is released, agreed with the reporter |

### What to expect

- We'll acknowledge your report and keep you updated.
- We'll credit you in the release notes unless you'd rather stay anonymous.
- We won't take legal action against reporters acting in good faith.

### What we ask

- Give us reasonable time to fix the issue before disclosing it.
- Don't exploit the vulnerability or access data that isn't yours.
- Don't test against other people's accounts. The shared demo account is fine for read-only checks; please don't change its settings or data.

## How Finobots protects data

### Isolation

- Every table has row level security. Each user has one workspace, and every row carries an `organization_id` checked against workspace membership.
- Chats, chat messages and notification preferences are private to the user who owns them.
- Storage buckets are private. Avatars and receipts live under the user's own folder; workspace files live under the workspace's folder.

### Secrets

- PayPal client secrets and AI provider keys are verified with the provider, then encrypted with AES-256-GCM using `CREDENTIALS_ENCRYPTION_KEY`. The row id is bound in as additional authenticated data, so a ciphertext can't be moved to another row.
- Encrypted values are stored in `connection_credentials` and `ai_provider_secrets`, which have row level security on, no policies and no client privileges. Only server code with the service role can read them, and they're never returned to the browser.
- API keys are shown once and stored as SHA-256 hashes.
- The browser only gets the Supabase URL and publishable key. No secret uses a `NEXT_PUBLIC_` variable.

### Actions with financial effect

- The assistant can only propose actions. They're saved as `proposed` in `agent_actions`.
- Only owners and admins can approve. The `actions` function reads the workspace from the stored action, never from the request, and claims the action before calling PayPal, so it runs at most once.
- Model output is validated before it's saved (allowed action types, invoice id format, length limits). Custom instructions are labelled as preferences in the system prompt and can't override these rules.

### Edge functions

- Every function validates its input (types, lengths, formats, UUIDs) before any database or provider call.
- CORS is limited to `ALLOWED_ORIGINS`.
- AI provider base URLs are fixed on the server, so users can't point requests at internal addresses.
- `webhooks` has JWT checks off because PayPal can't send a Supabase login; every event is verified with PayPal's signature API before anything is written.
- Internal errors are logged on the server and returned as a generic message.

### Sessions

- Supabase auth cookies plus `fb_session` and `fb_active` (HTTP-only, `SameSite=Lax`, `Secure` in production).
- Sessions last 1 day, or 30 days with Remember me, and end after 1 day without activity. `proxy.ts` enforces this on `/console`.
- Optional authenticator-app two-factor, and "sign out other devices".

### Cost controls

- The built-in model uses per-user credits (100, topped up by 5 a day) and capped reply length.
- Workspaces can set daily, weekly and monthly USD limits.
- Operators should also set a monthly spend limit with their AI provider.

## For contributors

- Never commit secrets, API keys, passwords or tokens. `.env.local` and `supabase/.env` are gitignored.
- Put function secrets in Supabase with `npx supabase secrets set`, not in code.
- If you commit a secret by mistake, rotate it straight away and email **security@finobots.com**.
- Keep row level security on for every new table, and add policies before exposing it to the app.
- Validate all input in edge functions, and use the user's client (not the service role) unless the task truly needs it.
