# Contributing to Finobots

Thank you for your interest in contributing! This guide will help you get started.

## Prerequisites

- Node.js 20+
- npm 10+
- Git

## Development Setup

1. **Fork and clone the repository**

   ```bash
   git clone https://github.com/YOUR_USERNAME/finobots.git
   cd finobots
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Fill in the values in `.env.local` as needed for local development.

4. **Start the development server**

   ```bash
   npm run dev
   ```

5. **Create a branch for your changes**

   ```bash
   git checkout -b feat/your-feature-name
   ```

## Code Style

- **TypeScript** is required for all new code.
- Use the existing import alias `@/*` for project imports.
- Follow the existing component structure under `components/ui/` for shadcn components.
- Server components are the default. Only use `"use client"` when interactivity is needed (state, event handlers, browser APIs).
- Keep components focused and composable.
- Use Tailwind CSS classes for styling. Do not introduce additional CSS frameworks.
- Add `data-slot` attributes when creating new shadcn-compatible components.

## Commit Conventions

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

- `feat` — a new feature
- `fix` — a bug fix
- `docs` — documentation changes
- `style` — formatting, no code change
- `refactor` — code change that neither fixes a bug nor adds a feature
- `perf` — performance improvement
- `test` — adding or correcting tests
- `chore` — build, dependencies, tooling

### Examples

```
feat(auth): add email verification flow
fix(console): correct sidebar width on mobile
docs(readme): update installation instructions
```

## Pull Request Process

1. **Run lint and build before submitting**

   ```bash
   npm run lint
   npm run build
   ```

2. **Write a clear PR description** that includes:
   - What changes were made and why
   - How to test the changes
   - Any breaking changes or migration notes
   - Related issues (e.g., `Closes #123`)

3. **Keep PRs focused** — one feature or fix per PR makes review faster.

4. **Update documentation** if your changes affect the README, env variables, or project structure.

5. **Add a changelog entry** under `[Unreleased]` in `CHANGELOG.md` when applicable.

## Reporting Bugs

Open a [GitHub issue](https://github.com/opsenes-ai/finobots/issues/new) with:

- A clear title and description
- Steps to reproduce
- Expected and actual behavior
- Screenshots if applicable
- Your environment (OS, Node.js version, browser)

## Requesting Features

Open a [GitHub issue](https://github.com/opsenes-ai/finobots/issues/new) with the `enhancement` label. Describe the feature, why it would be useful, and any alternatives you have considered.

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). Please review it before contributing.

## Questions?

Feel free to open a [GitHub Discussion](https://github.com/opsenes-ai/finobots/discussions) or reach out via issues.
