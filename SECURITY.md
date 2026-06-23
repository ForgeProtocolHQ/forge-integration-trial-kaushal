# Security Policy & Boundaries

This is an **evaluation / trial repository**. It is deliberately sandboxed.

## What is NOT in this repository (by design)

- ❌ No private keys, mnemonics, or signer credentials.
- ❌ No RPC secrets, API tokens, or production endpoints.
- ❌ No production database, Cloudflare, treasury, or admin-wallet access.
- ❌ No proprietary Forge contract source — only minimal **public** interface ABIs.
- ❌ No deployment workflow and no deployment authority.
- ❌ No copies of private Forge repositories or internal documents.

## Trial security boundary

The candidate working in this repository has **no access** to any private Forge
system, including (non-exhaustive): `forge-contracts`, `forge-app`, `forge-sdk`,
`forge-infra`, `forge-keepers`, production RPC/Cloudflare/databases/wallets,
deployment pipelines, or any treasury/admin keys. Work happens entirely against
**public BNB testnet** infrastructure via a fork-and-pull-request flow.

## Built-in safety properties

- **Read/simulate only.** The SDK never builds a wallet client and never holds a
  signer. Swaps run through viem `simulateContract` and are **not broadcast**.
- **No fabricated data.** Unconfigured addresses produce a `NOT_CONFIGURED`
  error and a clear UI state — never invented pools or quotes.
- **Configurable everything.** Chain id, RPC, explorer, and contract addresses
  are injected via environment; nothing is hardcoded to production.
- **Secrets are git-ignored.** `.env*` files are ignored; only `.env.example`
  with placeholders is tracked.

## Reporting

If you discover that any secret or private material has been committed here,
**do not open a public issue**. Contact the repository owners directly so the
credential can be rotated and the history scrubbed.
