# Finobots — Agent Guide

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project overview

Finobots is an open-source AI financial operations agent for small businesses. Users connect PayPal, then manage balances, transactions, reconciliation and cash flow, and chat with an assistant that proposes actions (send invoice, send reminder) for them to approve.

## Tech stack

- **Framework**: Next.js 16 (App Router, `cacheComponents` on, `proxy.ts` instead of middleware)
- **Language**: TypeScript (strict)
- **UI**: React 19, Tailwind CSS v4 (Turbopack), shadcn/ui (base-nova) on Base UI primitives (not Radix), Lucide icons
- **Grid**: AG Grid Community 36 (transactions ledger)
- **Backend**: Supabase Auth, Postgres (row level security), Storage and Edge Functions (Deno)
- **Integrations**: PayPal REST APIs; Claude (built in) and OpenAI or Gemini (bring your own key) through OpenAI-compatible chat completions

## Architecture

- **Server components by default.** Use `"use client"` only for state, events or browser APIs.
- **`cacheComponents` is on.** Request data read on the client (for example `useParams()`) must sit inside `<Suspense>`. Redirect-only pages export `instant = false`.
- **Import alias**: `@/*` resolves to the project root.
- **One workspace per user.** Every table has `organization_id` and row level security. Get the id in the browser with `getWorkspaceId()`.
- **Browser data access** goes straight to Supabase with the user's session, so row level security applies.
- **Edge functions** handle anything that needs secrets or external APIs. They reply with `{ data }` or `{ error: { code, message } }`. Call them with `callFunction()` from `@/lib/client`, which unwraps `data`.
- **Shared page state**: `createResource()` (load once, share across cards, `reload()` after changes) and `createStore()` (selection, filters) from `@/lib/client`.
- **Secrets** (PayPal credentials, AI keys) are encrypted with AES-256-GCM in `_shared/database.ts` and stored in service-role-only tables. Never return them to the browser and never use `NEXT_PUBLIC_` for them.

## Routes

- `/` — landing page
- `/auth/*` — login, signup, forgot, reset; `/auth/callback` exchanges OAuth and email codes
- `/legal/*` — terms, privacy, cookies
- `/console` — redirects to `/console/chat`
- `/console/chat`, `/console/chat/[chatId]` — new chat, chat session (streams from the `chat` function)
- `/console/recents` — previous chats
- `/console/accounts` — balances and manual accounts
- `/console/transaction` — AG Grid ledger, categories, reconciliation, receipts
- `/console/cashflow` — summaries, trends and forecast
- `/console/connections` — PayPal connections
- `/console/settings/*` — profile, personalization, usage, data, security, notifications, api

## Supabase

- Migrations: `supabase/migrations/`. Add new ones; never edit applied ones.
- Functions: `supabase/functions/` — `chat`, `actions`, `accounts`, `transactions`, `cashflow`, `connections`, `ai-providers`, `api-keys`, `webhooks`; shared code in `_shared/`.
- Function secrets: `CREDENTIALS_ENCRYPTION_KEY`, `ALLOWED_ORIGINS`, `AI_BASE_URL`, `AI_MODEL`, `AI_API_KEY`.
- Type-check: `npx --yes deno check --no-lock supabase/functions/<name>/index.ts`
- Deploy: `npx supabase functions deploy <name>`
- Migrate: `npx supabase db push --dry-run`, then `npx supabase db push`

## Key conventions

- Use `cn()`, `formatMoney()` and `formatDate()` from `@/lib/utils`.
- Never add amounts in different currencies together.
- shadcn components use `data-slot` attributes for styling hooks. Add them with `npx shadcn@latest add <name>`.
- Light theme only. Primary `#881337`, radius 5px, font Plus Jakarta Sans.
- British English in copy. Short labels, real empty states, no placeholder content.
- Agent actions with financial effect must be proposed and approved, never run directly.
- Follow Conventional Commits.
- Don't introduce new CSS frameworks or styling solutions.
- Run `npm run lint` and `npm run build` before submitting changes.

## Common commands

- `npm run dev` — development server
- `npm run build` — production build
- `npm run lint` — ESLint
- `npx shadcn@latest add <name>` — add a shadcn component
