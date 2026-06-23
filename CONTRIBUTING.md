# Contributing — Forge Integration Trial

This repository is used to run a **time-boxed technical trial**. If you are the
candidate, this document is your workflow.

## Workflow (fork & pull request)

You do **not** need write access to this repository or membership in the
organization. Contribute via a fork:

1. **Fork** `ForgeProtocolHQ/forge-integration-trial-kaushal` to your own GitHub
   account.
2. **Clone** your fork and install:
   ```bash
   git clone https://github.com/<your-username>/forge-integration-trial-kaushal.git
   cd forge-integration-trial-kaushal
   pnpm install
   ```
3. **Create a feature branch** off `main`:
   ```bash
   git checkout -b feat/forge-sdk-and-demo
   ```
4. Build your work. Keep commits focused and message them clearly.
5. **Before opening a PR**, make sure everything is green locally:
   ```bash
   pnpm lint && pnpm typecheck && pnpm test && pnpm build
   ```
6. Push your branch to your fork and open **one clean pull request** back to
   `ForgeProtocolHQ/forge-integration-trial-kaushal:main`.
7. Fill out the PR template completely, including the short architecture note and
   delivery summary.

> `main` is protected: direct pushes are blocked and CI must pass. All work lands
> through the PR from your fork.

## Code standards

- **TypeScript strict mode** — no `any` escapes without justification.
- **ESLint + Prettier** must pass (`pnpm lint`, `pnpm format:check`).
- **Tests** — add meaningful unit tests; keep the suite green (`pnpm test`).
- **Conventional-ish commits** (`feat:`, `fix:`, `docs:`, `test:`, `chore:`).
- **No secrets, ever** — no private keys, RPC secrets, tokens, or `.env` files.
  Only `.env.example` with placeholders is committed.

## What "done" looks like

See the trial issue and `docs/delivery-summary.md` for the full acceptance
criteria. In short: working SDK, working demo, ≥ 10 tests, CI passing, docs, and
one clean PR — with no secrets and no production deployment.

## Questions / progress

Use the trial issue thread for clarifications and milestone updates. Clear,
proactive communication is part of the evaluation.
