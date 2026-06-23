# Architecture Note

> Short architecture note for the trial. Candidates may extend this file as part
> of their delivery.

## Overview

A pnpm-workspace monorepo with a clean dependency direction:

```
apps/demo  ──depends on──▶  packages/sdk  ──depends on──▶  viem
   (UI)                        (logic)                     (chain I/O)
```

The demo contains **no chain logic of its own** — it composes the SDK. This
keeps blockchain correctness testable in isolation (Node, no browser) and makes
the UI a thin, replaceable layer.

## SDK layers

| Layer      | Files                                             | Responsibility                                                                    |
| ---------- | ------------------------------------------------- | --------------------------------------------------------------------------------- |
| Config     | `chains.ts`, `config.ts`                          | Resolve a fully-overridable `ForgeConfig`; BNB testnet chain object; chain guard. |
| Transport  | `client.ts`                                       | Read-only viem public client. No signer is ever constructed.                      |
| Primitives | `addresses.ts`, `errors.ts`, `types.ts`           | Address validation/links, `ForgeError` + error mapping, shared types.             |
| Domain     | `factory.ts`, `router.ts`, `pool.ts`, `events.ts` | Typed wrappers: discovery, quotes, simulation, pool/token reads.                  |
| ABIs       | `abis/*.ts`                                       | Minimal public interface ABIs as `as const` for viem inference.                   |

## Key decisions & trade-offs

- **`ForgeError` with stable `code`s.** A single `mapContractError` chokepoint
  converts viem/revert/RPC failures into a small, documented enum. UIs branch on
  `code`, never on fragile message strings. Trade-off: a mapping table to
  maintain, in exchange for predictable, testable error handling.
- **Optional on-chain methods.** Factory enumeration and pool reserves are
  treated as optional (`undefined` when unsupported) so the SDK works across
  deployments. Discovery therefore prefers event logs, with enumeration as a
  fast path when available.
- **Zero-address as "not configured".** Rather than throwing at construction for
  unset addresses (configuration time), the SDK exposes
  `isFactoryConfigured`/`isRouterConfigured` and fails calls with
  `NOT_CONFIGURED`. This lets the demo render an honest empty state.
- **Simulate, never broadcast.** `simulateContract` only. No wallet client lives
  in the SDK; signing/broadcasting is intentionally out of scope.
- **Paged, de-duplicated discovery.** `getLogs` is paged by `pageSize` to respect
  RPC range caps, and results are de-duped by pool address (earliest wins) for
  re-org safety.

## Demo composition

`Providers` (wagmi + react-query) → `WalletBar` → `NetworkGuard` (wrong-network
warning + switch) → `PoolList` (discovery) → `PoolDetail` + `SwapForm`
(simulation). Each data view uses react-query with the SDK as the query fn and
renders loading / empty / error states explicitly.
