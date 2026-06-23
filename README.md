# Forge Integration Trial — SDK + BNB Testnet Demo

> ⚠️ **This is an EVALUATION / TRIAL repository. It is not production software.**
> It exists solely to evaluate a candidate's ability to build a typed Web3 SDK
> and a testnet integration demo. It uses public BNB testnet endpoints,
> placeholder addresses, and minimal public interface ABIs only. It contains no
> proprietary Forge source, no secrets, and broadcasts no real transactions by
> default.

A small monorepo with two deliverables:

1. **`packages/sdk`** — `@forge-trial/sdk`, a typed, read/simulate-only TypeScript
   SDK for Forge Protocol on BNB testnet (factory, router, pool, utilities).
2. **`apps/demo`** — a Next.js + wagmi + viem interface that discovers pools,
   inspects them, and **simulates** swaps (never broadcasts by default).

---

## Project purpose

Build the first practical Forge Protocol SDK and a testnet integration demo that
proves the SDK works end to end:

- typed contract wrappers with structured errors,
- pool discovery via events + optional enumeration,
- swap **simulation** (no signing, no broadcasting),
- a professional, defensive UI covering the real failure modes of Web3 apps.

## Architecture

```
forge-integration-trial/
├── packages/sdk/            # @forge-trial/sdk — typed, read/simulate-only SDK
│   └── src/
│       ├── abis/            # minimal public interface ABIs (as const, typed)
│       ├── chains.ts        # BNB testnet chain config (configurable RPC/explorer)
│       ├── config.ts        # resolved, fully-overridable configuration + chain guard
│       ├── client.ts        # read-only viem public client (no signer, ever)
│       ├── addresses.ts     # address validation, checksums, explorer links
│       ├── errors.ts        # ForgeError + structured contract-error mapping
│       ├── events.ts        # PoolCreated decode + paged historical discovery + dedupe
│       ├── factory.ts       # ForgeFactory wrapper (enumeration optional)
│       ├── router.ts        # ForgeRouter wrapper: validate + quote + simulate
│       ├── pool.ts          # pool info + reserves + ERC-20 metadata
│       └── types.ts         # shared types
├── apps/demo/               # Next.js (App Router) testnet UI
│   └── src/
│       ├── app/             # layout, providers (wagmi + react-query), page
│       ├── components/      # WalletBar, NetworkGuard, PoolList, PoolDetail, SwapForm
│       └── lib/             # demo config from NEXT_PUBLIC_*, wagmi config
├── contracts/abis/          # framework-agnostic JSON ABI artifacts + notes
├── docs/                    # architecture, testnet, delivery summary
└── .github/workflows/ci.yml # install · lint · typecheck · test · build
```

**Design principles**

- **Read/simulate only.** The SDK never constructs a wallet client and never
  holds a signer or private key. Swaps are run through viem `simulateContract`.
- **Configurable, never hardcoded.** Chain, RPC, explorer, and all addresses are
  injected. Unset addresses use the zero sentinel and surface a clear
  "not configured" state instead of fabricating data.
- **Structured errors.** Every chain call resolves or rejects with a
  `ForgeError` carrying a stable `code`, so UIs branch on codes, not strings.
- **Optional on-chain methods.** Factory enumeration (`allPoolsLength`/`allPools`)
  and pool `getReserves` are treated as optional; the SDK degrades gracefully.

## Installation

Requires **Node ≥ 20** and **pnpm ≥ 9**.

```bash
pnpm install
```

## Environment variables

Copy `.env.example` and fill in values. **Never commit real secrets.** All
values are public; there are no private keys or API tokens anywhere in this repo.

| Variable                                                                | Used by    | Meaning                                      |
| ----------------------------------------------------------------------- | ---------- | -------------------------------------------- |
| `FORGE_CHAIN_ID` / `NEXT_PUBLIC_FORGE_CHAIN_ID`                         | SDK / demo | Chain id (BNB testnet = `97`)                |
| `FORGE_RPC_URL` / `NEXT_PUBLIC_FORGE_RPC_URL`                           | SDK / demo | Public BNB testnet RPC URL                   |
| `FORGE_EXPLORER_URL` / `NEXT_PUBLIC_FORGE_EXPLORER_URL`                 | SDK / demo | Block explorer base URL                      |
| `FORGE_FACTORY_ADDRESS` / `NEXT_PUBLIC_FORGE_FACTORY_ADDRESS`           | SDK / demo | Factory address (placeholder = zero address) |
| `FORGE_ROUTER_ADDRESS` / `NEXT_PUBLIC_FORGE_ROUTER_ADDRESS`             | SDK / demo | Router address (placeholder = zero address)  |
| `FORGE_FACTORY_DEPLOY_BLOCK` / `NEXT_PUBLIC_FORGE_FACTORY_DEPLOY_BLOCK` | SDK / demo | Block to start historical pool discovery     |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`                                  | demo       | Optional public WalletConnect id             |

For the demo, put `NEXT_PUBLIC_*` values in `apps/demo/.env.local`.

## Testnet configuration

- **Network:** BNB Smart Chain Testnet (`chainId = 97`, native token `tBNB`).
- **RPC:** any public testnet endpoint (default: a public BNBChain seed node).
- **Explorer:** `https://testnet.bscscan.com`.
- **Faucet:** obtain `tBNB` from the official BNB testnet faucet to exercise live
  reads against a real deployment.

Until you supply real `FACTORY`/`ROUTER` addresses, the SDK and demo run in
"not configured" mode and clearly say so — they never invent pools or quotes.

## SDK usage examples

```ts
import {
  configFromEnv,
  createForgePublicClient,
  ForgeFactory,
  ForgeRouter,
  readPoolInfo,
  validateSwapParams,
} from "@forge-trial/sdk";

const config = configFromEnv(process.env);
const client = createForgePublicClient(config);

// 1) Discover pools from PoolCreated events (paged, de-duped).
const factory = new ForgeFactory(client, config);
const pools = await factory.discoverPools(); // PoolCreatedEvent[]

// 2) Inspect a pool.
const info = await readPoolInfo(client, pools[0].pool);

// 3) Validate + simulate a swap (NEVER broadcasts).
const router = new ForgeRouter(client, config);
const params = validateSwapParams({
  tokenIn: info.token0,
  tokenOut: info.token1,
  amountIn: 1_000000000000000000n,
  recipient: "0xYourAccount...",
  slippageBps: 50, // 0.5%
  deadline: 9_999_999_999n,
});
const simulation = await router.simulateSwap(params, "0xYourAccount...");
```

## How pool discovery works

1. **Event scan (primary).** `discoverPoolsFromLogs` pages `getLogs` over the
   `PoolCreated` event from `FORGE_FACTORY_DEPLOY_BLOCK` to the latest block,
   respecting RPC range limits via `pageSize`. Logs are decoded with
   `decodePoolCreatedLog` and **de-duplicated by pool address**, keeping the
   earliest occurrence (robust to re-orgs and overlapping queries).
2. **Enumeration (optional).** If the deployment exposes `allPoolsLength` /
   `allPools`, `ForgeFactory.getPoolCount()` / `getPoolByIndex()` provide a
   direct path; when unsupported they return `undefined` so callers fall back to
   the event scan.

If the factory address is not configured, discovery throws
`ForgeError("NOT_CONFIGURED")` — it never returns fabricated pools.

## How transaction simulation works

`ForgeRouter.simulateSwap` is **simulation only**:

1. `validateSwapParams` checks addresses, distinct tokens, positive amount, and
   sane slippage **before** any RPC call.
2. An optional `getAmountOut` quote is read; `applySlippage` derives
   `amountOutMin` from the quote and the slippage tolerance.
3. viem `simulateContract` asks the node what _would_ happen — it does **not**
   sign or send anything.
4. Reverts and RPC failures are mapped to structured `ForgeError`s
   (`INSUFFICIENT_ALLOWANCE`, `INSUFFICIENT_BALANCE`, `CONTRACT_REVERTED`,
   `RPC_UNAVAILABLE`, …).

Broadcasting a real swap is intentionally out of scope and requires separate
approval.

## Security limitations

- Read/simulate only; **no signing, no broadcasting** by default.
- No private keys, no RPC secrets, no API tokens, no production endpoints.
- Minimal **public** interface ABIs only — no proprietary contract source.
- Placeholder addresses by default; all addresses are injected via env.
- See [`SECURITY.md`](./SECURITY.md) for the full boundary.

## Commands

```bash
pnpm lint         # ESLint (flat config) across the workspace
pnpm typecheck    # tsc --noEmit for every package
pnpm test         # SDK unit tests (Vitest)
pnpm build        # build the SDK, then the Next.js demo
pnpm format       # Prettier write
pnpm format:check # Prettier check (CI)
pnpm dev          # run the demo locally
```

## Status

This repository is provided **for evaluation purposes only** and is **not
production software**. Do not deploy it, point it at mainnet, or treat any
address in it as authoritative.
