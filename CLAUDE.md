# CLAUDE.md

Guidance for Claude when working on the Finobots codebase. [AGENTS.md](AGENTS.md) has the same rules in short form.

## Project overview

Finobots is an open-source AI financial operations agent for small businesses. Users connect PayPal, then manage balances, transactions, reconciliation and cash flow, and chat with an assistant that proposes actions (send invoice, send reminder) for them to approve. Nothing with financial effect runs without approval.

## Tech stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript (strict)
- **UI**: React 19, Tailwind CSS v4, shadcn/ui (base-nova) on Base UI primitives, Lucide icons
- **Grid**: AG Grid Community 36
- **Backend**: Supabase (Auth, Postgres with row level security, Storage, Edge Functions on Deno)
- **Integrations**: PayPal REST APIs; Claude Haiku 5.5 built in; Claude, OpenAI or Gemini with the user's own key

## Next.js 16

This version has breaking changes. Read the relevant guide in `node_modules/next/dist/docs/` before writing code.

- `cacheComponents` is enabled in `next.config.ts`. Request-time data (cookies, `useParams()`, uncached fetches) must sit inside `<Suspense>`, or the build fails with a blocking-route error.
- Private per-user data on the server uses `"use cache: private"` (see `lib/auth/profile.ts`).
- `proxy.ts` replaces middleware and only runs on `/console/:path*`.
- Tailwind CSS v4 uses the Turbopack loader, not PostCSS.

## Data access

- **Browser**: `createClient()` from `@/lib/client`. Queries run as the user, so row level security applies.
- **Server**: `await createClient()` from `@/lib/server`.
- **Workspace**: `getWorkspaceId()` returns the user's single workspace id.
- **Edge functions**: `callFunction(name, body)` returns `{ data, error }` with the `{ data }` envelope unwrapped. Streaming chat calls `/functions/v1/chat` with `fetch` and reads Server-Sent Events.
- **Shared state**: `createResource(loader)` loads once and shares data across cards (`use()`, `reload()`, `get()`); `createStore(initial)` shares selection and filters.

## Edge functions

In `supabase/functions/`, with shared helpers in `_shared/` (`auth`, `cors`, `database`, `paypal`, `ai`, `response`, `validation`).

- Validate every input with `_shared/validation.ts`.
- Authenticate with `requireUser(req)` and check the role with `requireOrgMember(auth, orgId, roles?)`.
- Use `auth.client` (row level security) by default; `createAdminClient()` only when needed.
- Encrypt secrets with `saveCredentials` / `saveAiKey`; read them with `loadCredentials` / `loadAiKey`.
- Reply with `json(req, data)`; throw `HttpError(status, message, code)` for user-facing errors.
- Type-check with `npx --yes deno check --no-lock supabase/functions/<name>/index.ts` before deploying.

## Component architecture

- Server components by default; `"use client"` only for interactivity.
- shadcn components live in `components/ui/`.
- Layouts: `components/app/` (public) and `components/console/` (dashboard).
- Page components: `components/pages/console/<area>/`, exported through each folder's `index.ts`. Each area keeps its shared resource in one file (for example `accounts/listing.tsx`, `transactions/ledger.tsx`, `cashflow/overview.tsx`, `connections/connected.tsx`).
- Import alias `@/*`.

## Styling

- Tailwind CSS v4 with CSS-based theme tokens in `app/globals.css` (OKLCH). No `tailwind.config.js`.
- Light theme only. Primary `#881337`, radius 5px, Plus Jakarta Sans.
- `cn()` from `@/lib/utils` for conditional classes.
- `prose` classes for long-form content (legal pages).

## Code conventions

- TypeScript strict mode.
- `formatMoney(amount, currency)` and `formatDate(value, withTime?)` from `@/lib/utils`. Never add different currencies together.
- British English in copy; short labels; real empty states.
- Accessible controls: labels for inputs, `aria-label` on icon buttons.
- Conventional Commits.

## Project structure

```
app/                  # App Router pages and layouts
  auth/               # login, signup, forgot, reset, callback
  console/            # chat, recents, accounts, cashflow, transaction, connections, settings
  legal/              # terms, privacy, cookies
components/
  app/  console/      # layouts
  pages/              # page components
  shared/console/     # profile bar
  ui/                 # shadcn/ui
lib/                  # Supabase clients, helpers, auth
supabase/
  migrations/         # schema, policies, buckets
  functions/          # edge functions and _shared helpers
proxy.ts              # session checks for /console
```

## Common tasks

- **Add a shadcn component**: `npx shadcn@latest add <name>`
- **Run dev server**: `npm run dev`
- **Build**: `npm run build`
- **Lint**: `npm run lint`
- **New migration**: add `supabase/migrations/<timestamp>_<name>.sql`, then `npx supabase db push --dry-run` and `npx supabase db push`
- **Deploy a function**: `npx supabase functions deploy <name>`
