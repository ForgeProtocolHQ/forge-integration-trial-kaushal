# BNB Testnet Configuration

| Setting      | Value                                                      |
| ------------ | ---------------------------------------------------------- |
| Network      | BNB Smart Chain Testnet                                    |
| Chain id     | `97`                                                       |
| Native token | `tBNB` (18 decimals)                                       |
| Default RPC  | `https://data-seed-prebsc-1-s1.bnbchain.org:8545` (public) |
| Explorer     | `https://testnet.bscscan.com`                              |

## Getting set up

1. Add BNB testnet to your wallet (chain id `97`). The demo also offers a
   one-click **Switch network** action when you are on the wrong chain.
2. Get test `tBNB` from the official BNB Smart Chain testnet faucet.
3. Copy `.env.example` → `.env` (root) and `apps/demo/.env.local` (demo), then
   set a public RPC URL and — if you have them — real BNB testnet
   `FACTORY`/`ROUTER` addresses. Leave addresses as the zero placeholder to run
   in "not configured" mode.

## Notes

- Use only **public** RPC endpoints. Do not paste keyed/private RPC URLs into
  this repository.
- Historical pool discovery starts from `FORGE_FACTORY_DEPLOY_BLOCK`. Set this to
  the factory's deployment block to avoid scanning the entire chain.
- Some public RPCs cap `eth_getLogs` block ranges; tune `pageSize` in
  `discoverPoolsFromLogs` if you hit range limits.
