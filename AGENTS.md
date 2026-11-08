# Finobots — Agent Guide

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project Overview

Finobots is an open-source AI financial operations agent for small businesses. It helps users manage invoices, payments, expenses, reconciliation, and cash flow through chat, with interactive tables, charts, and approvals.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript (strict mode)
- **UI**: React 19, Tailwind CSS v4 (Turbopack), shadcn/ui (base-nova style)
- **Icons**: Lucide React
- **Primitives**: Base UI (not Radix)
- **Typography**: @tailwindcss/typography (`prose` classes)

## Architecture

- **Server components by default.** Use `"use client"` only when interactivity is needed.
- **Import alias**: `@/*` resolves to the project root.
- **shadcn components** live in `components/ui/` and use Base UI primitives.
- **Layout components** are split into `components/app/` (public) and `components/console/` (dashboard).
- **Theme tokens** are CSS variables in `app/globals.css` using OKLCH colors. No `tailwind.config.js`.
- **`cn()` utility** is re-exported from `cn` package via `@/lib/utils`.

## Routes

- `/` — redirects to `/auth/login`
- `/auth/*` — login, signup, verify, forgot, reset (auth layout with AppLayout)
- `/legal/*` — terms, privacy, cookies (legal layout with AppLayout + prose styling)

## Key Conventions

- Use `cn()` from `@/lib/utils` for conditional class names.
- shadcn components use `data-slot` attributes for styling hooks.
- Follow Conventional Commits (`feat:`, `fix:`, `docs:`, etc.).
- Do not introduce new CSS frameworks or styling solutions.
- Run `npm run build` and `npm run lint` before submitting changes.

## Common Commands

- `npm run dev` — development server
- `npm run build` — production build
- `npm run lint` — ESLint
- `npx shadcn@latest add <name>` — add shadcn component
