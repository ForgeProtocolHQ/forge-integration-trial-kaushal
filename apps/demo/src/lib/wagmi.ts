import { createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { createBnbTestnet } from "@forge-trial/sdk";
import { getDemoConfig } from "./config";

const forgeConfig = getDemoConfig();
export const chain = createBnbTestnet({
  rpcUrl: forgeConfig.rpcUrl,
  explorerUrl: forgeConfig.explorerUrl,
});

/**
 * wagmi config. Uses the injected connector (MetaMask / browser wallets) only —
 * no project secrets required. Read/simulate flows never need a signer beyond
 * the connected account.
 */
export const wagmiConfig = createConfig({
  chains: [chain],
  connectors: [injected()],
  transports: {
    [chain.id]: http(forgeConfig.rpcUrl),
  },
  ssr: true,
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
