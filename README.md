# Finobots

Finobots is an open-source AI financial operations agent for small businesses. Connect a PayPal account, then chat with an assistant about your balances, invoices and cash flow. The assistant can propose actions such as sending an invoice or a payment reminder, and nothing runs until you approve it.

**Live demo:** [https://finobots.vercel.app](https://finobots.vercel.app)

| | |
| --- | --- |
| Demo email | `demo@finobots.com` |
| Demo password | `Password@123` |

The demo account is shared, so please don't store anything private in it.

## Contents

- [What it does](#what-it-does)
- [How it works](#how-it-works)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Supabase set-up](#supabase-set-up)
- [PayPal sandbox set-up](#paypal-sandbox-set-up)
- [AI models, credits and limits](#ai-models-credits-and-limits)
- [Edge functions](#edge-functions)
- [Database](#database)
- [Security model](#security-model)
- [Project structure](#project-structure)
- [Scripts](#scripts)
- [Known limitations](#known-limitations)
- [Contributing, roadmap, security, licence](#contributing)

## What it does

### Chat (`/console/chat`)

- Streams replies from Claude Haiku 5.5 by default.
- Saves every chat and message, so conversations can be reopened from Recents.
- The assistant follows your workspace's tone, reply length, custom instructions and saved memories (Settings > Personalization).
- When the assistant wants to send a PayPal invoice or reminder, it proposes the action. An approval card appears above the chat with **Approve** and **Reject**. Approving runs the action on PayPal through the `actions` function; rejecting records the decision. Nothing is sent without approval.
- Clear messages when you run out of credits or reach a spending limit.

### Recents (`/console/recents`)

- Chats grouped as Today, Yesterday, Previous 7 days and Older, with the latest message as a preview.
- Open, rename or delete any chat.

### Connections (`/console/connections`)

- Connect a PayPal REST app (sandbox or live) with its client ID and secret. PayPal checks the credentials before anything is saved, and the secret is stored encrypted on the server.
- Per connection: **Sync balances**, **Import transactions** (last 30 days), **Test** and **Disconnect**. Disconnecting deletes the stored credentials.
- **Sync all** refreshes every connection at once.

### Accounts (`/console/accounts`)

- One account per PayPal balance currency, created and updated by sync.
- Manual accounts for money held elsewhere, with an opening balance.
- Totals per currency (currencies are never added together), share of each account, details and an edit form (rename, type, archive; balance editing for manual accounts only).

### Transactions (`/console/transaction`)

- A ledger built with [AG Grid Community](https://www.ag-grid.com/): sort, filter, resize columns, quick search and pagination.
- Filters for date range, status and account.
- Per transaction: details, a timeline, categories (presets or custom), reconciliation with an optional reference, and a private receipt upload (PDF or image).

### Cash flow (`/console/cashflow`)

- Money in, money out and net for the chosen range and currency (completed transactions only).
- Monthly in/out chart, income streams, spending by category and a month-by-month trend table.
- A 30-day balance forecast based on the average daily net over the last 90 days.

### Settings

| Page | What you can do |
| --- | --- |
| Profile | Upload an avatar, edit your display name, copy your email, user ID and organisation ID |
| Personalization | Choose the model (built-in or your own Claude, OpenAI or Gemini key), reply tone and length, custom instructions, memories |
| Usage | Credits left, messages and tokens over 30 days, daily/weekly/monthly USD spending limits, usage by model, recent history |
| Data | Import PayPal transactions, export transactions as CSV or JSON, choose a retention period |
| Security | Change password, authenticator-app two-factor, sign out other devices, link PayPal sign-in |
| Notifications | Email and in-app channels, payment/invoice/approval alerts, digest frequency |
| API | Create scoped API keys (shown once, stored hashed) and revoke them |

### Sign-in

- Email and password with email confirmation, forgot and reset password.
- Optional "Continue with PayPal" sign-in through a Supabase custom OAuth provider.
- Sessions last 1 day, or 30 days with **Remember me**, and end after 1 day of inactivity.

## How it works

```
Browser (Next.js 16, React 19)
  │  Supabase JS client: auth, row level security reads/writes, storage
  │  Edge function calls with the user's JWT
  ▼
Supabase
  ├─ Postgres with row level security on every table
  ├─ Storage: avatars, user-uploads, workspace-files (all private)
  └─ Edge functions (Deno)
       ├─ chat ─────────► Claude (OpenAI-compatible endpoint), or the
       │                  workspace's own Claude / OpenAI / Gemini key
       ├─ actions ──────► PayPal Invoicing (send invoice / reminder)
       ├─ accounts ─────► PayPal Reporting (balances)
       ├─ transactions ─► PayPal Reporting (transaction search)
       ├─ cashflow       summaries and forecasts from stored transactions
       ├─ connections    verify, encrypt and store PayPal credentials
       ├─ ai-providers   verify, encrypt and store AI provider keys
       ├─ api-keys       create hashed API keys
       └─ webhooks ◄──── PayPal payment capture events (signature verified)
```

Each user has exactly one workspace (organisation), created at sign-up. Every row carries an `organization_id`, and row level security limits reads and writes to members of that workspace. Server code only uses the service role for things no user may do directly, such as reading encrypted credentials or recording usage.

## Tech stack

- [Next.js](https://nextjs.org) 16 (App Router, `cacheComponents`, `proxy.ts`) and [React](https://react.dev) 19
- [TypeScript](https://www.typescriptlang.org) (strict)
- [Tailwind CSS](https://tailwindcss.com) v4 (Turbopack), [shadcn/ui](https://ui.shadcn.com) (base-nova) on [Base UI](https://base-ui.com) primitives, [Lucide](https://lucide.dev) icons
- [AG Grid Community](https://www.ag-grid.com/) 36 for the transactions ledger
- [Supabase](https://supabase.com): Auth, Postgres, Storage and Edge Functions (Deno)
- [PayPal REST APIs](https://developer.paypal.com/): Reporting (balances, transactions), Invoicing, Webhooks
- [Anthropic Claude](https://www.anthropic.com/) through its OpenAI-compatible API; OpenAI and Gemini supported with your own key
- Deployed on [Vercel](https://vercel.com)

## Getting started

### Prerequisites

- Node.js 20 or later and npm 10 or later
- A [Supabase](https://supabase.com) project
- A [PayPal developer](https://developer.paypal.com/) account (sandbox is free)
- An [Anthropic API key](https://console.anthropic.com/) for the built-in model

### 1. Clone and install

```bash
git clone https://github.com/opsenes-ai/finobots.git
cd finobots
npm install
```

### 2. Environment variables

```bash
cp .env.example .env.local
```

| Variable | Where it's used | Value |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Browser and server | Your project URL, from Supabase > Project Settings > API |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser and server | The publishable key (`sb_publishable_…`) |
| `NEXT_PUBLIC_APP_URL` | `robots.txt`, `sitemap.xml` | Optional. Defaults to `https://finobots.vercel.app` |

Only these public values go in `.env.local` or Vercel. Every secret lives in Supabase (see below), never in a `NEXT_PUBLIC_` variable.

### 3. Set up Supabase and PayPal

Follow [Supabase set-up](#supabase-set-up), then [PayPal sandbox set-up](#paypal-sandbox-set-up).

### 4. Run it

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), sign up, confirm your email and sign in.

## Supabase set-up

The Supabase CLI is installed as a dev dependency, so use it through `npx`. On Windows PowerShell, use `npx.cmd` if scripts are blocked.

### 1. Link the project

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
```

### 2. Apply the migrations

```bash
npx supabase db push --dry-run   # check what will run
npx supabase db push
```

This creates every table, row level security policy, helper function and storage bucket in `supabase/migrations/`.

### 3. Set the function secrets

```bash
npx supabase secrets set CREDENTIALS_ENCRYPTION_KEY=<32 random bytes, base64>
npx supabase secrets set ALLOWED_ORIGINS=https://your-app.vercel.app,http://localhost:3000
npx supabase secrets set AI_BASE_URL=https://api.anthropic.com/v1
npx supabase secrets set AI_MODEL=claude-haiku-5-5
npx supabase secrets set AI_API_KEY=<your Anthropic API key>
```

| Secret | Purpose |
| --- | --- |
| `CREDENTIALS_ENCRYPTION_KEY` | AES-256-GCM key that encrypts PayPal credentials and AI provider keys. Generate with `openssl rand -base64 32`. Changing it makes stored credentials unreadable. |
| `ALLOWED_ORIGINS` | Comma-separated origins allowed to call the functions from a browser |
| `AI_BASE_URL` | OpenAI-compatible base URL for the built-in model |
| `AI_MODEL` | Built-in model id |
| `AI_API_KEY` | Key for the built-in model. Set a monthly spend limit in the Anthropic Console too. |

`SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are provided to functions automatically.

### 4. Deploy the edge functions

```bash
npx supabase functions deploy chat
npx supabase functions deploy actions
npx supabase functions deploy accounts
npx supabase functions deploy transactions
npx supabase functions deploy cashflow
npx supabase functions deploy connections
npx supabase functions deploy ai-providers
npx supabase functions deploy api-keys
npx supabase functions deploy webhooks
```

`webhooks` runs with JWT verification off (see `supabase/config.toml`), because PayPal can't send a Supabase login. It verifies every event with PayPal instead.

### 5. Configure Auth

In Supabase > Authentication:

- **URL Configuration:** set the Site URL to your app URL, and add `https://your-app/auth/callback` and `https://your-app/auth/login` (plus the `http://localhost:3000` versions) to the redirect URLs.
- **Multi-factor:** keep TOTP enabled for the Security page's two-factor set-up.
- **PayPal sign-in (optional):** add a custom OAuth provider named `paypal` using PayPal's sandbox OAuth endpoints, and turn on manual identity linking so users can link PayPal from Settings > Security.

## PayPal sandbox set-up

1. Sign in to the [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/) and switch to **Sandbox**.
2. Under **Apps & Credentials**, create a REST app. Copy its **Client ID** and **Secret**.
3. In the app's features, enable **Transaction search** and **Invoicing**, and save. Transaction search can take a few hours to start returning data.
4. Under **Testing Tools > Sandbox Accounts**, use (or create) a business account and a personal (buyer) account. Make a few test payments so there's data to import.
5. In Finobots, open **Connections**, enter the client ID and secret with environment **Sandbox**, and click **Connect**.
6. Click **Sync balances**, then **Import transactions**.

### Webhooks (optional)

To receive payment events as they happen, add a webhook in the PayPal app pointing to:

```
https://<project-ref>.supabase.co/functions/v1/webhooks?connection_id=<connection id>
```

Subscribe to `PAYMENT.CAPTURE.COMPLETED`, `.PENDING`, `.DENIED`, `.REVERSED` and `.REFUNDED`. Pass the webhook id as `webhook_id` when calling the `connections` function's `connect` or `rotate` action, so events can be verified.

## AI models, credits and limits

### Built-in model

Chat uses **Claude Haiku 5.5** (`claude-haiku-5-5`) through Anthropic's OpenAI-compatible endpoint. To keep costs low, the built-in model:

- caps replies at 512 tokens,
- sends only the last 20 messages of history,
- uses **credits**.

### Credits

- Every user starts with **100 credits**, an internal budget of **5 USD** (1 credit = 0.05 USD).
- **5 credits** are added every day at midnight UTC, up to 100.
- Each reply costs credits based on its tokens at Haiku's price (0.10 USD per million input tokens, 0.50 USD per million output tokens).
- At 0 credits, chat pauses until the next top-up, or until you connect your own key.

### Your own key

Settings > Personalization > Models lets you connect a key for **Claude**, **OpenAI** or **Gemini**. The key is tested with a tiny request before it's saved, encrypted with AES-256-GCM, and never sent back to the browser (only its last 4 characters are shown). One provider is active at a time; you can switch back to the built-in model at any time. Your own key doesn't use credits and isn't capped on reply length.

Default models (you can enter another model id):

| Provider | Default model | Base URL (fixed on the server) |
| --- | --- | --- |
| Claude | `claude-haiku-5-5` | `https://api.anthropic.com/v1` |
| OpenAI | `gpt-5.4-nano` | `https://api.openai.com/v1` |
| Gemini | `gemini-3.8-flash` | `https://generativelanguage.googleapis.com/v1beta/openai` |

Base URLs can't be set by users, which rules out server-side request forgery through this feature.

### Spending limits

Settings > Usage sets **daily**, **weekly** and **monthly** limits in USD, across whichever model is in use. `0` means no limit. Chat pauses when a limit is reached and resumes when the period resets (midnight UTC, Monday, or the 1st). Costs are estimates from public token prices in `supabase/functions/_shared/ai.ts`; unknown models are costed at a cautious 1 USD / 5 USD per million tokens.

## Edge functions

All functions are in `supabase/functions/`, share code from `_shared/`, accept `POST` with a JSON body, and reply with `{ "data": … }` or `{ "error": { "code", "message" } }`.

| Function | Actions | Who |
| --- | --- | --- |
| `chat` | Streams a reply as Server-Sent Events (`text`, `action`, `error`, `done`). Applies credits and spending limits, records usage, saves proposed actions. | Any member |
| `actions` | `approve` or `reject` a proposed action by `action_id`. Approving sends the PayPal invoice or reminder, at most once. | Owners and admins |
| `accounts` | `sync` balances for one or every connection | Owners and admins |
| `transactions` | `import` (up to 31 days per call), `categorise`, `reconcile` | Import: owners and admins. Others: any member |
| `cashflow` | `summary` (by currency, category and month), `forecast` | Any member |
| `connections` | `connect`, `rotate`, `test`, `disconnect` | Owners and admins |
| `ai-providers` | `connect`, `use`, `use_default`, `remove` | Owners and admins |
| `api-keys` | Create a key with chosen scopes. Revoking is done from the app. | Owners and admins |
| `webhooks` | Receives PayPal payment capture events | PayPal (signature verified) |

Type-check a function locally with:

```bash
npx --yes deno check --no-lock supabase/functions/chat/index.ts
```

## Database

| Table | Holds |
| --- | --- |
| `profiles` | Display name, username, avatar path |
| `organizations`, `organization_members` | The workspace and its single owner |
| `connections`, `connection_credentials` | PayPal connections; credentials are encrypted and service-role only |
| `accounts` | Balances per currency, synced or manual |
| `transactions` | Imported or added transactions, categories, reconciliation, receipt path |
| `chats`, `chat_messages` | Conversations, private to their owner |
| `agent_actions` | Proposed actions and their approval status |
| `agent_settings` | Tone, length, instructions, approval rules, spending limits |
| `agent_memories` | Facts the assistant remembers |
| `ai_providers`, `ai_provider_secrets` | Connected AI keys; secrets are encrypted and service-role only |
| `ai_usage`, `ai_credits` | Per-reply tokens, estimated cost and credits; credit balances |
| `notification_preferences` | Channels, alerts and digest |
| `api_keys`, `api_key_usage` | Hashed API keys and daily request counts |
| `data_jobs` | Import and export jobs |

Storage buckets (all private): `avatars` (`<user_id>/…`), `user-uploads` (`<user_id>/…`, receipts) and `workspace-files` (`<org_id>/…`).

## Security model

- **Row level security** on every table. Members see their workspace's data; chats and notification preferences are private to their owner.
- **Encrypted secrets.** PayPal credentials and AI keys are encrypted with AES-256-GCM, with the row id bound in as additional data, and stored in tables no client role can read.
- **Approvals.** The assistant can only propose actions. Approving requires an owner or admin, and each action is claimed before PayPal is called so it can't run twice.
- **Hashed API keys.** Keys are shown once; only a SHA-256 hash is stored.
- **No secrets in the browser.** Only the Supabase URL and publishable key are public.
- **CORS** is limited to `ALLOWED_ORIGINS`.
- **Input validation** on every function, with lengths and formats checked before any database or provider call.
- **Sessions** use HTTP-only cookies with a 1-day (or 30-day) lifetime and a 1-day idle timeout, enforced in `proxy.ts` for `/console`.

See [SECURITY.md](SECURITY.md) to report a vulnerability.

## Project structure

```
finobots/
├── app/
│   ├── auth/                 # login, signup, forgot, reset, OAuth callback
│   ├── console/              # chat, recents, accounts, cashflow, transaction, connections, settings
│   ├── legal/                # terms, privacy, cookies
│   ├── globals.css           # theme tokens (OKLCH)
│   └── layout.tsx
├── components/
│   ├── app/                  # public layout
│   ├── console/              # console layout and sidebar
│   ├── pages/
│   │   ├── app/home/         # landing page sections
│   │   └── console/          # page components (accounts, cashflow, chat, connections,
│   │                         #   recents, settings, transactions)
│   ├── shared/console/       # profile bar
│   └── ui/                   # shadcn/ui components
├── lib/
│   ├── client.ts             # browser Supabase client, function and shared-state helpers
│   ├── server.ts             # server Supabase client
│   ├── utils.ts              # cn(), money and date formatting
│   └── auth/                 # session policy, proxy session refresh, actions, profile
├── supabase/
│   ├── config.toml
│   ├── migrations/           # schema, policies, functions, buckets
│   └── functions/            # edge functions and _shared helpers
├── public/                   # icons, llms.txt, skills.md
└── proxy.ts                  # session checks for /console
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npx shadcn@latest add <name>` | Add a shadcn/ui component |

## Known limitations

- The assistant only knows what you tell it in the chat. It can't read your accounts or transactions yet.
- Proposed actions cover sending an existing PayPal invoice and sending a reminder. Creating invoices isn't supported yet.
- API keys can be created and revoked, but no endpoint accepts them yet.
- Notification preferences and data retention are saved but not acted on yet (no emails are sent, no data is deleted).
- Costs for models other than the three defaults are estimates.
- The PayPal webhook id can only be set through the `connections` function, not the Connections form.
- Detail routes (`/console/accounts/[accountId]`, `/console/transaction/[recordId]`, `/console/connections/[connectionId]`) are placeholders.

## Contributing

Contributions are welcome. Please read the [Contributing Guide](CONTRIBUTING.md) and [Code of Conduct](CODE_OF_CONDUCT.md) first.

## Roadmap

See the [Roadmap](ROADMAP.md).

## Security

To report a vulnerability, read the [Security Policy](SECURITY.md). Please don't open a public issue.

## Licence

MIT. See [LICENSE](LICENSE).

## Links

- [Live demo](https://finobots.vercel.app)
- [GitHub repository](https://github.com/opsenes-ai/finobots)
- [Report a bug](https://github.com/opsenes-ai/finobots/issues/new)
- [Request a feature](https://github.com/opsenes-ai/finobots/issues/new)
- [Discussions](https://github.com/opsenes-ai/finobots/discussions)
