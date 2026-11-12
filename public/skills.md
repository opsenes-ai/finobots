# Finobots — Agent Skills

Instructions and context for AI coding agents working on the Finobots codebase.

## Project

Finobots is an open-source AI financial operations agent for small businesses. Users connect PayPal, then manage balances, transactions, reconciliation and cash flow, and chat with an assistant that proposes actions for them to approve.

- Repo: https://github.com/opsenes-ai/finobots
- Live: https://finobots.vercel.app

## Stack

- Next.js 16 (App Router, `cacheComponents`, `proxy.ts`). Read `node_modules/next/dist/docs/` before writing Next.js code.
- React 19, TypeScript (strict)
- Tailwind CSS v4 (Turbopack, no tailwind.config.js)
- shadcn/ui (base-nova) in `components/ui/`, on Base UI primitives (not Radix)
- Lucide React icons
- AG Grid Community 36 (transactions ledger)
- Supabase: Auth, Postgres with row level security, Storage, Edge Functions (Deno)
- PayPal REST APIs; Claude, OpenAI and Gemini through OpenAI-compatible chat completions

## Key conventions

- Server components by default. `"use client"` only for state, events or browser APIs.
- Request-time data on the client (such as `useParams()`) goes inside `<Suspense>`.
- Import alias `@/*`.
- `cn()`, `formatMoney()`, `formatDate()` from `@/lib/utils`. Never add different currencies together.
- Theme tokens are CSS variables in `app/globals.css` (OKLCH). Light theme only.
- Primary colour `#881337` (`oklch(0.37 0.15 13)`), radius 5px (`--radius: 0.3125rem`), font Plus Jakarta Sans.
- British English in copy, short labels, real empty states.
- Financial actions are proposed and approved, never run directly.
- Conventional Commits.

## Project structure

```
app/
  auth/              # login, signup, forgot, reset, callback
  console/           # chat, recents, accounts, cashflow, transaction, connections, settings
  legal/             # terms, privacy, cookies
  globals.css        # theme tokens
components/
  app/               # AppLayout, AppHeader, AppFooter
  console/           # ConsoleLayout, ConsoleHeader, ConsoleSidebar
  pages/
    app/home/        # landing page sections
    console/         # accounts, cashflow, chat, connections, recents, settings, transactions
  shared/console/    # ProfileBar
  ui/                # shadcn/ui components
lib/
  client.ts          # browser client, getWorkspaceId, callFunction, createStore, createResource
  server.ts          # server client
  utils.ts           # cn, formatMoney, formatDate
  auth/              # session policy, proxy session refresh, actions, profile
supabase/
  migrations/        # schema, policies, buckets
  functions/         # chat, actions, accounts, transactions, cashflow, connections,
                     # ai-providers, api-keys, webhooks, _shared
public/
  connections/       # integration icons
  icons/app/         # app icons
```

## Common commands

```bash
npm run dev                     # development server
npm run build                   # production build
npm run lint                    # ESLint
npx shadcn@latest add <name>    # add a shadcn component
npx supabase db push --dry-run  # preview migrations
npx supabase functions deploy <name>
npx --yes deno check --no-lock supabase/functions/<name>/index.ts
```

## Environment variables

App (`.env.local`, Vercel), public values only:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_APP_URL=            # optional
```

Function secrets (`npx supabase secrets set`):

```
CREDENTIALS_ENCRYPTION_KEY=     # 32 random bytes, base64
ALLOWED_ORIGINS=
AI_BASE_URL=https://api.anthropic.com/v1
AI_MODEL=claude-haiku-5-5
AI_API_KEY=
```

## Supabase usage

- **Browser**: `import { createClient } from "@/lib/client"`
- **Server**: `import { createClient } from "@/lib/server"` (async)
- **Proxy**: `import { updateSession } from "@/lib/auth/middleware"` (in `proxy.ts`, console routes only)
- **Functions**: `callFunction<T>(name, body)` returns `{ data, error }`
- **Workspace**: `getWorkspaceId()`
