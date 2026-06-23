# Contract ABIs (public interface shapes)

These JSON files are **minimal, illustrative, public interface shapes** for the
contracts this trial integrates against on BNB testnet. They are intentionally
generic AMM-style interfaces:

- `forgeFactory.json` — factory: config reads, optional enumeration, `PoolCreated` event
- `forgeRouter.json` — router: `getAmountOut` quote + `swapExactTokensForTokens` (simulated only)
- `forgePool.json` — pool/pair: tokens, type, fee, reserves
- `erc20.json` — standard ERC-20 read surface

## Important

- These ABIs contain **no proprietary Forge contract source** and reveal no
  internal implementation. They describe only the external call surface needed
  for the trial task.
- Enumeration functions (`allPoolsLength`, `allPools`) and `getReserves` are
  treated as **optional** by the SDK — a real deployment may not implement them,
  and the SDK falls back to event-log discovery.
- The canonical, type-checked copies live in
  [`packages/sdk/src/abis`](../../packages/sdk/src/abis) as `as const` arrays for
  viem type inference. These JSON files are the framework-agnostic artifacts.

If you are given real deployed BNB testnet addresses, set them via the
environment (`*_FACTORY_ADDRESS`, `*_ROUTER_ADDRESS`) — never hardcode them.
