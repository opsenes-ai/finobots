# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

#### Chat and agent

- Chat wired to the `chat` edge function, with streamed replies, a Stop button and saved history.
- Chats are created with their first message; messages are stored in `chat_messages` and reloaded when a chat is reopened.
- Approval cards for proposed actions (send invoice, send reminder) with Approve and Reject, calling the `actions` function.
- Recents page: chats grouped by date with previews, rename and delete.
- Built-in model: Claude Haiku 5.5 (`claude-haiku-5-5`) through Anthropic's OpenAI-compatible endpoint.
- Bring your own key for Claude, OpenAI or Gemini (`ai-providers` function, `ai_providers` and `ai_provider_secrets` tables). Keys are tested, encrypted and never returned.
- Personalization: reply tone and length, custom instructions and memories, all added to the system prompt.
- Credits for the built-in model: 100 credits (5 USD) per user, 5 added daily up to 100.
- Daily, weekly and monthly USD spending limits; `0` means no limit.
- Usage recording per reply (`ai_usage`): tokens, estimated cost and credits.
- Built-in model safeguards: 512-token replies and a 20-message history window.

#### Finance pages

- Connections: connect PayPal (sandbox or live), sync balances, import transactions, test and disconnect; Sync all.
- Accounts: overview, list, balances per currency, details, manual account creation, editing, archiving and deletion.
- Transactions: AG Grid Community ledger with sorting, filtering, quick search and pagination; filters by date, status and account; details, timeline, categories, reconciliation and receipt upload.
- Cash flow: money in, out and net; monthly chart; income streams; spending by category; monthly trends; 30-day forecast.

#### Settings

- Profile: avatar upload, display name, copyable email, user ID and organisation ID.
- Usage: credits, 30-day totals, spending limits, breakdown by model and history.
- Data: PayPal import, CSV and JSON export, retention period.
- Security: password change, authenticator-app two-factor, sign out other devices, PayPal sign-in linking.
- Notifications: channels, alerts and digest.
- API: scoped API keys (`api-keys` function), shown once and stored as SHA-256 hashes; revoke.

#### Platform

- Edge functions: `chat`, `actions`, `accounts`, `transactions`, `cashflow`, `connections`, `ai-providers`, `api-keys`, `webhooks`.
- Migrations for profiles, workspaces, connections, accounts, transactions, chats, agent actions and settings, API keys, data jobs, storage buckets, AI providers, personalization, usage, credits and limits.
- Shared client helpers: `callFunction`, `createStore`, `createResource`, `getWorkspaceId`, `formatMoney`, `formatDate`.
- Dependencies: `ag-grid-community` and `ag-grid-react` 36.3.0; shadcn `badge`, `progress`, `radio-group`, `select`, `switch`, `table`, `textarea`.

### Changed

- Settings sidebar now lists Profile, Personalization, Usage, Data, Security, Notifications and API.
- The connections catalogue lists PayPal only.
- The account deletion section was removed from Settings > Data.

### Fixed

- Edge function responses (`{ data: … }`) are now unwrapped correctly, so the new API key and the import count show up.
- The chat session page reads its route parameter inside a Suspense boundary, as `cacheComponents` requires.

## [0.1.0] - 2026-11-08

### Added

- Next.js 16 project scaffold with App Router
- React 19 and TypeScript setup
- Tailwind CSS v4 with Turbopack integration
- shadcn/ui component library (base-nova style)
- shadcn components: button, card, input, label
- Lucide React icon library
- App layout components (header, footer, layout)
- Console layout components (sidebar, header, layout)
- Authentication pages: login, signup, verify, forgot password, reset password
- Auth layout with centred card design
- Root path and auth path redirects to login
- Legal pages: Terms of Service, Privacy Policy, Cookie Policy
- Legal content with `@tailwindcss/typography` styling
- Legal layout with app header and footer
- Legal root path redirect to Terms of Service
- Project documentation: README, CONTRIBUTING, SECURITY, CODE_OF_CONDUCT, ROADMAP
- Environment variable templates (`.env.example`, `.env.local`)
- AGENTS.md and CLAUDE.md for AI-assisted development
