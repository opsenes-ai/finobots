# Finobots

Finobots is an open-source AI financial operations agent for small businesses. It helps users manage invoices, payments, expenses, reconciliation, and cash flow through chat, with interactive tables, charts, and approvals.

## Features

- **AI-powered chat interface** — interact with your finances through natural language
- **Invoice management** — create, track, and manage invoices
- **Payment processing** — send and track payments
- **Expense tracking** — log and categorize expenses
- **Reconciliation** — match transactions and reconcile accounts
- **Cash flow insights** — visual charts and reports
- **Approval workflows** — request and approve financial actions

## Tech Stack

- [Next.js](https://nextjs.org) 16 (App Router)
- [React](https://react.dev) 19
- [TypeScript](https://www.typescriptlang.org)
- [Tailwind CSS](https://tailwindcss.com) v4
- [shadcn/ui](https://ui.shadcn.com) components
- [Lucide](https://lucide.dev) icons
- [Base UI](https://base-ui.com) primitives

## Prerequisites

- Node.js 20+ (see [`.nvmrc`](.nvmrc) or use [nvm](https://github.com/nvm-sh/nvm))
- npm 10+

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/opsenes-ai/finobots.git
cd finobots
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration. See [`.env.example`](.env.example) for all available variables.

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Build for production |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint |

## Project Structure

```
finobots/
├── app/                  # Next.js App Router pages and layouts
│   ├── auth/             # Authentication pages (login, signup, etc.)
│   ├── legal/            # Legal pages (terms, privacy, cookies)
│   ├── globals.css       # Global styles and theme tokens
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Home page (redirects to /auth/login)
├── components/
│   ├── app/              # Public-facing layout (header, footer)
│   ├── console/          # Console layout (sidebar, header)
│   └── ui/               # shadcn/ui component library
├── lib/                  # Shared utilities
├── public/               # Static assets
├── .env.example          # Environment variable template
├── .env.local            # Local environment (gitignored)
├── next.config.ts        # Next.js configuration
├── tsconfig.json         # TypeScript configuration
└── package.json          # Dependencies and scripts
```

## Contributing

We welcome contributions! Please read our [Contributing Guide](CONTRIBUTING.md) and [Code of Conduct](CODE_OF_CONDUCT.md) before getting started.

## Roadmap

See our [Roadmap](ROADMAP.md) to learn about planned features and the project direction.

## Security

To report a security vulnerability, please read our [Security Policy](SECURITY.md). Do not open a public issue for security-related matters.

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

## Links

- [GitHub Repository](https://github.com/opsenes-ai/finobots)
- [Report a Bug](https://github.com/opsenes-ai/finobots/issues)
- [Request a Feature](https://github.com/opsenes-ai/finobots/issues)
