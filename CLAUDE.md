# CLAUDE.md

This file provides guidance to Claude when working with the Finobots codebase.

## Project Overview

Finobots is an open-source AI financial operations agent for small businesses. It helps users manage invoices, payments, expenses, reconciliation, and cash flow through a chat interface with interactive tables, charts, and approvals.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **UI**: React 19, Tailwind CSS v4, shadcn/ui (base-nova style)
- **Icons**: Lucide React
- **Primitives**: Base UI
- **Typography**: @tailwindcss/typography (prose classes)

## Important Notes

### Next.js 16

This version of Next.js has breaking changes from earlier versions. Before writing code, read the relevant guide in `node_modules/next/dist/docs/`. Key differences:
- `cacheComponents` is enabled in `next.config.ts`
- Layouts and pages use typed props (e.g., `LayoutProps<"/">`)
- Tailwind CSS v4 uses the Turbopack loader, not PostCSS

### Component Architecture

- **Server components** are the default. Only use `"use client"` when interactivity is needed.
- shadcn components live in `components/ui/` and use Base UI primitives.
- Layout components are in `components/app/` (public) and `components/console/` (dashboard).
- Import alias is `@/*` (resolves to project root).

### Styling

- Tailwind CSS v4 with CSS-based theme configuration (no `tailwind.config.js`).
- Theme tokens are defined as CSS variables in `app/globals.css` using OKLCH colors.
- shadcn components use `data-slot` attributes for styling hooks.
- Use `prose dark:prose-invert` classes for long-form content (legal pages, docs).

### Code Conventions

- TypeScript strict mode is enabled.
- Use the `cn()` utility from `@/lib/utils` for conditional class names.
- Follow Conventional Commits for commit messages.
- Keep components focused and composable.

## Project Structure

```
app/            # App Router pages and layouts
  auth/         # Authentication (login, signup, verify, forgot, reset)
  legal/        # Legal pages (terms, cookies, privacy)
components/
  app/          # Public layout (header, footer)
  console/      # Dashboard layout (sidebar, header)
  ui/           # shadcn/ui component library
lib/            # Shared utilities
```

## Common Tasks

- **Add a shadcn component**: `npx shadcn@latest add <component-name>`
- **Run dev server**: `npm run dev`
- **Build**: `npm run build`
- **Lint**: `npm run lint`
