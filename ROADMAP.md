# Roadmap

This document outlines the planned direction and milestones for Finobots.

## Status legend

- ✅ Completed
- 🔄 In progress
- 📋 Planned

---

## Phase 1: Foundation (v0.1.x) ✅

- [x] Next.js 16 project scaffold with App Router
- [x] Tailwind CSS v4 and shadcn/ui set-up
- [x] App and console layout components
- [x] Authentication pages (login, signup, forgot, reset)
- [x] Legal pages (terms, privacy, cookies)
- [x] Project documentation and open-source files

## Phase 2: Authentication and workspaces ✅

- [x] Email sign-up with confirmation
- [x] Session policy (1 day, 30 days with Remember me, 1 day idle)
- [x] Password reset by email
- [x] Protected console routes (`proxy.ts`)
- [x] Profile settings (avatar, display name)
- [x] One workspace per user, isolated with row level security
- [x] Authenticator-app two-factor
- [x] PayPal sign-in and account linking (needs a custom OAuth provider in Supabase)

## Phase 3: AI chat 🔄

- [x] Chat UI with saved history and Recents
- [x] Streaming replies (Claude Haiku 5.5 built in)
- [x] Bring your own Claude, OpenAI or Gemini key
- [x] Tone, length, instructions and memories
- [x] Credits and USD spending limits
- [x] Approval cards for proposed actions
- [ ] Read tools: accounts, transactions, cash flow and PayPal invoices
- [ ] Interactive tables and charts inside chat
- [ ] Conversation export

## Phase 4: Invoices 📋

- [x] Send an existing PayPal invoice, with approval
- [x] Send a payment reminder, with approval
- [ ] Create invoices with line items, with approval
- [ ] Invoice list with status (draft, sent, paid, overdue)
- [ ] Customer list

## Phase 5: Payments and expenses 🔄

- [x] Import PayPal transactions
- [x] Categories (presets and custom)
- [x] Receipt upload
- [x] Multi-currency balances, never mixed
- [x] PayPal payment webhooks
- [ ] Receipt text extraction
- [ ] Payment reminders on a schedule

## Phase 6: Reconciliation and cash flow 🔄

- [x] PayPal balance sync
- [x] Manual reconciliation with references
- [x] Cash flow dashboard and monthly trends
- [x] 30-day forecast
- [ ] Automatic transaction matching
- [ ] Profit and loss report

## Phase 7: Approvals and notifications 🔄

- [x] Approve or reject agent actions, run at most once
- [x] Notification preferences
- [ ] Email and in-app delivery
- [ ] Approvals page with history
- [ ] Audit log

## Phase 8: Integrations and API 🔄

- [x] Scoped API keys (create, revoke, hashed)
- [ ] API endpoints that accept the keys
- [ ] More payment providers
- [ ] Accounting software sync

## Phase 9: Polish and scale (v1.0) 📋

- [ ] Detail pages for accounts, transactions and connections
- [ ] Data retention enforcement
- [ ] Test suite
- [ ] Accessibility audit (WCAG 2.2 AA)
- [ ] Internationalisation
- [ ] Documentation site and deployment guides

---

## Feedback

Have a feature request or suggestion? Open an [issue](https://github.com/opsenes-ai/finobots/issues/new) or start a [discussion](https://github.com/opsenes-ai/finobots/discussions).

This roadmap may change based on community feedback and project priorities.
