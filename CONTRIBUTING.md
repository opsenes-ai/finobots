# Contributing to Finobots

Thanks for your interest in contributing. This guide covers set-up, conventions and the pull request process.

## Prerequisites

- Node.js 20 or later, npm 10 or later
- Git
- A Supabase project for development (a free one is fine)
- Optional: a PayPal sandbox app and an Anthropic API key, to try PayPal features and chat

## Development set-up

1. **Fork and clone**

   ```bash
   git clone https://github.com/YOUR_USERNAME/finobots.git
   cd finobots
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

4. **Database and functions**

   Link your Supabase project, push the migrations, set the function secrets and deploy the functions. The full steps are in the README under [Supabase set-up](README.md#supabase-set-up).

5. **Start the dev server**

   ```bash
   npm run dev
   ```

6. **Create a branch**

   ```bash
   git checkout -b feat/your-feature-name
   ```

## Code style

### Front end

- TypeScript (strict) for all code. Use the `@/*` import alias.
- Server components by default. Add `"use client"` only for state, events or browser APIs.
- Read the relevant guide in `node_modules/next/dist/docs/` before using Next.js APIs; this version differs from older ones. `cacheComponents` is on, so request data (such as route params read on the client) must sit inside a `<Suspense>` boundary.
- Use shadcn/ui components from `components/ui/` (Base UI primitives, not Radix). Add new ones with `npx shadcn@latest add <name>`.
- Style with Tailwind classes and the theme tokens in `app/globals.css`. Don't add other CSS frameworks.
- Use `cn()`, `formatMoney()` and `formatDate()` from `@/lib/utils`.
- Call edge functions with `callFunction()` from `@/lib/client`. It returns `{ data, error }` with the response unwrapped.
- Share data between cards on a page with `createResource()` and `createStore()` from `@/lib/client`.
- Keep copy short and in British English. Show an empty state when there's no data, not placeholder content.
- Make interactive elements accessible: labels for inputs, `aria-label` for icon buttons, visible focus.

### Database

- Add a new migration in `supabase/migrations/` (`YYYYMMDDHHMMSS_description.sql`); never edit one that has been applied.
- Turn on row level security for every new table and add policies scoped by `organization_id`.
- Revoke client privileges on tables that hold secrets.
- Check with `npx supabase db push --dry-run` before pushing.

### Edge functions

- Put shared code in `supabase/functions/_shared/`.
- Validate every input with the helpers in `_shared/validation.ts`.
- Use the user's client (`requireUser`) so row level security applies. Use the admin client only when the task needs it, and check access first.
- Reply with `json()` and throw `HttpError` for errors the user should see.
- Type-check before deploying:

  ```bash
  npx --yes deno check --no-lock supabase/functions/<name>/index.ts
  ```

## Commit conventions

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`.

```
feat(transactions): add receipt upload
fix(chat): read route params inside Suspense
docs(readme): add PayPal sandbox steps
```

## Pull request process

1. **Run lint and build**

   ```bash
   npm run lint
   npm run build
   ```

2. **Describe the change**: what and why, how to test it, any migrations or new secrets, and related issues (`Closes #123`).
3. **Keep it focused**: one feature or fix per PR.
4. **Update the docs** when you change set-up, environment variables, secrets, functions or project structure.
5. **Add a changelog entry** under `[Unreleased]` in `CHANGELOG.md`.

## Reporting bugs

Open a [GitHub issue](https://github.com/opsenes-ai/finobots/issues/new) with a clear title, steps to reproduce, expected and actual behaviour, screenshots if helpful, and your environment (OS, Node.js version, browser). For security issues, follow [SECURITY.md](SECURITY.md) instead.

## Requesting features

Open a [GitHub issue](https://github.com/opsenes-ai/finobots/issues/new) with the `enhancement` label. Describe the feature, why it's useful and any alternatives you've considered.

## Code of conduct

By taking part you agree to the [Code of Conduct](CODE_OF_CONDUCT.md).

## Questions

Open a [GitHub Discussion](https://github.com/opsenes-ai/finobots/discussions).
