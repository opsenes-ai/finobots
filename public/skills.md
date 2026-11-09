# Finobots — Agent Skills

This file provides instructions and context for AI coding agents working on the Finobots codebase.

## Project

Finobots is an open-source AI financial operations agent for small businesses. It helps users manage invoices, payments, expenses, reconciliation, and cash flow through chat.

- Repo: https://github.com/opsenes-ai/finobots
- Live: https://finobots.vercel.app

## Stack

- Next.js 16 (App Router) — read `node_modules/next/dist/docs/` before writing any Next.js code
- React 19, TypeScript (strict)
- Tailwind CSS v4 (Turbopack, no tailwind.config.js)
- shadcn/ui (base-nova style) — components in `components/ui/`
- Base UI primitives (not Radix)
- Lucide React icons
- Supabase (auth + database) — clients in `lib/client.ts`, `lib/server.ts`; auth code in `lib/auth/`

## Key Conventions

- Server components by default. Use `"use client"` only when needed (state, events, browser APIs).
- Import alias `@/*` resolves to project root.
- Use `cn()` from `@/lib/utils` for conditional class names.
- Theme tokens are CSS variables in `app/globals.css` using OKLCH colors.
- Light theme only — no dark mode.
- Primary color: `#881337` (`oklch(0.37 0.15 13)`).
- Border radius: 5px (`--radius: 0.3125rem`).
- Font: Plus Jakarta Sans only.
- Follow Conventional Commits.

## Project Structure

```
app/
  auth/           # login, signup, forgot, reset
  console/        # dashboard routes
  legal/          # terms, privacy, cookies
  globals.css     # theme tokens
  layout.tsx      # root layout
  page.tsx        # home (landing page)

components/
  app/            # AppLayout, AppHeader, AppFooter
  console/        # ConsoleLayout, ConsoleHeader, ConsoleSidebar
  pages/
    app/home/     # Hero, Features, Workflow, Integrations, FAQ, CTA
    console/      # accounts, cashflow, chat, connections, recents, settings, transactions
  shared/
    console/      # ProfileBar
  ui/             # shadcn/ui components

lib/
  client.ts       # Supabase browser client
  server.ts       # Supabase server client
  auth/
    actions.ts    # server actions (startSession)
    middleware.ts # Supabase session refresh + session policy
    session.ts    # session rules: 1 day, 30 days remember me, 1 day idle
  utils.ts        # cn() utility

public/
  connections/    # integration icons (paypal.png, venmo.png)
  icons/app/      # app icons (favicon.png, dark.png, light.png)
```

## Common Commands

```bash
npm run dev       # development server
npm run build     # production build
npm run lint      # ESLint
npx shadcn@latest add <name>   # add shadcn component
```

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

## Supabase Clients

- **Browser**: `import { createClient } from "@/lib/client"`
- **Server**: `import { createClient } from "@/lib/server"` (async, use in Server Components and Route Handlers)
- **Proxy**: `import { updateSession } from "@/lib/auth/middleware"` (used in `proxy.ts`, console routes only)
