<div align="center">

# Finobots

**An open-source AI financial operations agent for small businesses.**

[Live demo](https://finobots.vercel.app) · [Report a bug](https://github.com/opsenes-ai/finobots/issues/new) · [Request a feature](https://github.com/opsenes-ai/finobots/issues/new) · [Discussions](https://github.com/opsenes-ai/finobots/discussions)

![Licence: MIT](https://img.shields.io/badge/licence-MIT-881337)
![Next.js 16](https://img.shields.io/badge/Next.js-16-000000)
![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20Edge%20Functions-3ECF8E)
![PayPal](https://img.shields.io/badge/PayPal-REST%20APIs-003087)

</div>

## Table of contents

- [About the project](#about-the-project)
- [Features](#features)
- [Built with](#built-with)
- [Architecture](#architecture)
- [App navigation](#app-navigation)
- [PayPal integration](#paypal-integration)
- [AG Grid](#ag-grid)
- [Getting started](#getting-started)
- [Folder structure](#folder-structure)
- [Scripts](#scripts)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [Security](#security)
- [Licence](#licence)

## About the project

Running the finances of a small business means jumping between payment dashboards, spreadsheets and inboxes. Finobots brings that work into one place. Connect a PayPal account, and Finobots keeps your balances and transactions up to date, helps you categorise and reconcile them, and shows where your cash is going.

At its centre is a chat assistant. Ask it about your finances in plain language, and when something needs doing, such as sending an invoice or a payment reminder, it proposes the action for you to review. **Nothing with financial effect runs until you approve it.**

Finobots is built to be safe by default: every workspace is isolated with row level security, provider credentials are encrypted on the server and never sent to the browser, and AI usage is capped with credits and spending limits.

## Features

- **Chat assistant** with streamed replies, saved conversations and personalised tone, length, instructions and memories.
- **Human approval** for every action the assistant proposes, run at most once.
- **Choice of model**: Claude built in, or bring your own Claude, OpenAI or Gemini key.
- **PayPal integration**: balance sync, transaction import and payment webhooks, for sandbox and live apps.
- **Accounts** across currencies, synced or added manually. Currencies are never mixed.
- **Transactions ledger** with sorting, filtering, search, categories, reconciliation and receipts.
- **Cash flow** summaries, monthly trends, spending breakdowns and a short-term forecast.
- **Usage controls**: credits for the built-in model, plus daily, weekly and monthly spending limits.
- **Account security**: two-factor authentication, session limits and scoped API keys.
- **Data portability**: export transactions as CSV or JSON.

## Built with

| Area | Technology |
| --- | --- |
| Framework | [Next.js](https://nextjs.org) 16 (App Router), [React](https://react.dev) 19, [TypeScript](https://www.typescriptlang.org) |
| UI | [Tailwind CSS](https://tailwindcss.com) v4, [shadcn/ui](https://ui.shadcn.com), [Base UI](https://base-ui.com), [Lucide](https://lucide.dev) |
| Data grid | [AG Grid Community](https://www.ag-grid.com) |
| Backend | [Supabase](https://supabase.com): Auth, Postgres, Storage, Edge Functions |
| Payments | [PayPal REST APIs](https://developer.paypal.com) |
| AI | [Anthropic Claude](https://www.anthropic.com), with optional OpenAI and Google Gemini |
| Hosting | [Vercel](https://vercel.com) |

## Architecture

```
┌──────────────────────────┐
│  Next.js app (browser)   │  pages, chat, data grid
└────────────┬─────────────┘
             │  user session
┌────────────▼─────────────┐
│         Supabase         │
│  Auth · Postgres (RLS)   │
│  Storage · Edge Functions│
└──────┬─────────────┬─────┘
       │             │
┌──────▼─────┐ ┌─────▼──────┐
│   PayPal   │ │ AI models  │
│ REST APIs  │ │ Claude ... │
└────────────┘ └────────────┘
```

- The app reads and writes data directly through Supabase, so row level security applies to every query.
- Anything that needs credentials or an external API runs in an edge function: chat, approvals, PayPal sync and import, cash flow calculations, and credential storage.
- PayPal sends payment events to a webhook function, which verifies each one before saving it.

## App navigation

| Section | Purpose |
| --- | --- |
| Chat | Talk to the assistant and approve the actions it proposes |
| Recents | Find, rename and delete previous chats |
| Accounts | Balances across connected and manual accounts |
| Transactions | The ledger, with categories, reconciliation and receipts |
| Cash flow | Money in and out, trends and forecast |
| Connections | Connect and manage PayPal |
| Settings | Profile, personalisation, usage, data, security, notifications and API |

## PayPal integration

Finobots connects to a PayPal REST app, in the sandbox or live, and keeps its data in step with PayPal.

| What | PayPal API | Where it runs |
| --- | --- | --- |
| Verify the app's credentials when you connect | OAuth 2.0 client credentials | `connections` function |
| Sync a balance for each currency | Reporting: balances | `accounts` function |
| Import transactions, up to 31 days per call, with fees as separate rows | Reporting: transaction search | `transactions` function |
| Send an invoice or a payment reminder, after you approve it | Invoicing | `actions` function |
| Record payments as they happen (completed, pending, denied, reversed, refunded) | Webhooks, each event verified with PayPal | `webhooks` function |
| Optional "Continue with PayPal" sign-in and account linking | Log in with PayPal (OAuth) | Supabase Auth |

How it's kept safe:

- **Credentials stay on the server.** The client secret is checked with PayPal, then encrypted (AES-256-GCM) and stored where only server code can read it. It's never sent back to the browser.
- **Nothing is sent without approval.** The assistant can only propose an invoice or reminder. An owner or admin approves it, and each action runs at most once.
- **Webhooks are verified.** Every event is checked with PayPal's signature verification before anything is saved.
- **Currencies stay separate.** Each PayPal balance currency becomes its own account, and amounts in different currencies are never added together.

To try it, create a REST app in the [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/), turn on **Transaction search** and **Invoicing**, then enter its client ID and secret on the **Connections** page. Use **Sync balances** and **Import transactions** from there.

## AG Grid

Finobots uses [AG Grid Community](https://www.ag-grid.com) for its data tables. Every grid shares one wrapper, `components/ui/data-grid.tsx`, which registers the modules once and applies a theme that matches the app's colour, radius and font.

| Page | Grid |
| --- | --- |
| Transactions | The ledger: sort, filter, resize, quick search and pagination. Click a row to see its details, double-click to open it |
| Account details | That account's transactions |
| Connection details | Latest activity from the connection |
| Cash flow | Monthly trends, with a pinned totals row |
| Recents | Chats with search, sorting, inline rename and delete |
| Settings > Usage | AI usage history: provider, model, tokens, credits and estimated cost |
| Settings > API | API keys with revoke, and daily requests per key |
| Settings > Data | Import and export history |

Shared defaults: every column can be sorted, filtered and resized, and pagination only appears when there are more rows than fit on a page. Clicks on buttons inside a cell don't count as row clicks.

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org) 20 or later and npm 10 or later
- A [Supabase](https://supabase.com) project
- A [PayPal developer](https://developer.paypal.com) account (the sandbox is free)
- An API key from an AI provider

### Installation

1. Clone the repository and install dependencies:

   ```bash
   git clone https://github.com/opsenes-ai/finobots.git
   cd finobots
   npm install
   ```

2. Link your Supabase project and apply the database migrations:

   ```bash
   npx supabase link --project-ref <your-project-ref>
   npx supabase db push
   ```

3. Deploy the edge functions:

   ```bash
   npx supabase functions deploy
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000), create an account, then go to **Connections** to connect a PayPal sandbox app.

See the [Contributing Guide](CONTRIBUTING.md) for the full development set-up.

## Folder structure

```
finobots/
├── .github/
│   └── workflows/                 # CodeQL and dependency review
├── app/                           # Next.js App Router
│   ├── [...rest]/                 # catch-all not-found route
│   ├── auth/                      # sign-in and account recovery
│   │   ├── callback/
│   │   ├── forgot/
│   │   ├── login/
│   │   ├── reset/
│   │   └── signup/
│   ├── console/                   # signed-in app
│   │   ├── accounts/
│   │   │   └── [accountId]/
│   │   ├── cashflow/
│   │   ├── chat/
│   │   │   └── [chatId]/
│   │   ├── connections/
│   │   │   └── [connectionId]/
│   │   ├── recents/
│   │   ├── settings/
│   │   │   ├── api/
│   │   │   ├── data/
│   │   │   ├── notifications/
│   │   │   ├── personalization/
│   │   │   ├── profile/
│   │   │   ├── security/
│   │   │   └── usage/
│   │   └── transaction/
│   │       └── [recordId]/
│   ├── legal/                     # terms, privacy, cookies
│   │   ├── cookies/
│   │   ├── privacy/
│   │   └── terms/
│   ├── globals.css                # theme tokens
│   ├── layout.tsx                 # root layout
│   ├── not-found.tsx
│   ├── page.tsx                   # landing page
│   ├── robots.ts
│   └── sitemap.ts
├── components/
│   ├── app/                       # public layout: header, footer
│   ├── console/                   # app layout: header, sidebar
│   ├── pages/
│   │   ├── app/
│   │   │   └── home/              # landing page sections
│   │   └── console/
│   │       ├── accounts/
│   │       ├── cashflow/
│   │       ├── chat/
│   │       │   ├── hooks/
│   │       │   ├── lib/
│   │       │   └── ui/
│   │       ├── connections/
│   │       ├── recents/
│   │       ├── settings/
│   │       │   └── pages/
│   │       │       ├── agent/
│   │       │       ├── api/
│   │       │       ├── data/
│   │       │       ├── general/
│   │       │       ├── members/
│   │       │       ├── notifications/
│   │       │       ├── personalisation/
│   │       │       ├── profile/
│   │       │       ├── security/
│   │       │       └── usage/
│   │       └── transactions/
│   ├── shared/
│   │   └── console/               # profile bar
│   └── ui/                        # shadcn/ui components and the AG Grid wrapper
├── lib/
│   ├── auth/                      # sessions, profile, server actions
│   ├── client.ts                  # browser Supabase client and helpers
│   ├── server.ts                  # server Supabase client
│   └── utils.ts                   # class names, money and date formatting
├── public/
│   ├── connections/               # integration logos
│   ├── icons/
│   │   └── app/                   # app icons
│   ├── llms.txt
│   └── skills.md
├── supabase/
│   ├── functions/                 # edge functions (Deno)
│   │   ├── _shared/               # auth, CORS, database, PayPal, AI, validation
│   │   ├── accounts/              # balance sync
│   │   ├── actions/               # approve and run proposed actions
│   │   ├── ai-providers/          # bring-your-own AI keys
│   │   ├── api-keys/              # API key creation
│   │   ├── cashflow/              # summaries and forecast
│   │   ├── chat/                  # streamed assistant replies
│   │   ├── connections/           # PayPal credentials
│   │   ├── transactions/          # import, categorise, reconcile
│   │   └── webhooks/              # PayPal events
│   ├── migrations/                # schema, policies and storage buckets
│   └── config.toml
├── AGENTS.md
├── CHANGELOG.md
├── CLAUDE.md
├── CODE_OF_CONDUCT.md
├── CONTRIBUTING.md
├── LICENSE
├── README.md
├── ROADMAP.md
├── SECURITY.md
├── components.json
├── eslint.config.mjs
├── next.config.ts
├── package.json
├── proxy.ts                       # session checks for the signed-in app
└── tsconfig.json
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |

## Roadmap

Planned work includes invoice creation, automatic transaction matching, email notifications and more payment providers. See the [Roadmap](ROADMAP.md) for details.

## Contributing

Contributions are welcome. Please read the [Contributing Guide](CONTRIBUTING.md) and the [Code of Conduct](CODE_OF_CONDUCT.md) before opening a pull request.

## Security

Please report vulnerabilities privately as described in the [Security Policy](SECURITY.md). Don't open a public issue.

## Licence

Distributed under the MIT Licence. See [LICENSE](LICENSE) for details.
