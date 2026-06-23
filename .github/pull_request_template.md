# Pull Request — Forge Integration Trial

## Summary

<!-- What does this PR deliver? 2–4 sentences. -->

## Architecture note

<!-- Short note: how the SDK is structured, key decisions, trade-offs. -->

## Delivery summary

<!-- See docs/delivery-summary.md. Summarize what is done and how to run it. -->

## Checklist

- [ ] `pnpm lint` passes
- [ ] `pnpm format:check` passes
- [ ] `pnpm typecheck` passes
- [ ] `pnpm test` passes (≥ 10 meaningful tests)
- [ ] `pnpm build` passes (SDK + demo)
- [ ] CI is green on this PR

## Scope coverage

**SDK**

- [ ] ForgeFactory (config, count/index where supported, PoolCreated decode, historical discovery)
- [ ] ForgeRouter (param validation, quote/prepare, simulate, structured errors, no broadcast)
- [ ] Pool info (validation, tokens, type, fee, reserves, token metadata)
- [ ] Utilities (chain config, addresses, ABIs, validation, explorer links, error types, public client)

**Demo**

- [ ] Wallet connect + BNB testnet validation + wrong-network switch
- [ ] Pool list / detail / metadata
- [ ] Swap form with slippage + simulation result
- [ ] Error/loading/empty states (rejection, balance, allowance, revert, RPC, invalid input, wrong network)

## Security confirmation

- [ ] **No secrets committed** (no private keys, RPC secrets, tokens, or `.env` files).
- [ ] **No production deployment**; BNB testnet + public endpoints only.
- [ ] No proprietary Forge source added; only public interface ABIs.

## Notes for reviewers

<!-- Anything intentionally out of scope, known limitations, follow-ups. -->
