# Delivery Summary (candidate to complete)

> Fill this in as part of your pull request. Keep it short and concrete.

## What was delivered

- [ ] TypeScript SDK (`@forge-trial/sdk`) — factory, router, pool, utilities
- [ ] Next.js demo — wallet connect, network guard, pool list/detail, swap simulation
- [ ] ≥ 10 meaningful automated tests, all passing
- [ ] Documentation (README + this summary + architecture note)
- [ ] CI passing (install · lint · typecheck · test · build)

## Architecture note

_2–5 sentences: how the SDK is structured, key decisions, and trade-offs._

## How to run

```bash
pnpm install
cp .env.example .env            # set a public RPC + (optional) testnet addresses
pnpm test
pnpm build
pnpm dev                        # open the demo
```

## Test coverage highlights

_List the required areas you covered: address validation, chain config, event
decoding, pool normalization, duplicate-event handling, error mapping, router
input validation, wrong-chain behavior, one mocked success flow, one mocked
failure flow._

## Known limitations / next steps

_What you would do with more time; anything intentionally out of scope._

## Confirmations

- [ ] No secrets committed (no private keys, RPC secrets, tokens, `.env`).
- [ ] No production deployment; BNB testnet + public endpoints only.
- [ ] Submitted as a single clean PR from a fork.
