import { defineChain } from "viem";

/** BNB Smart Chain Testnet chain id. Public and fixed. */
export const BNB_TESTNET_ID = 97 as const;

/**
 * BNB testnet chain definition.
 *
 * The RPC URL is configurable: pass your own public endpoint to
 * {@link createBnbTestnet}. The default is a public BNB testnet seed node and
 * contains no secrets.
 */
export const DEFAULT_BNB_TESTNET_RPC = "https://data-seed-prebsc-1-s1.bnbchain.org:8545" as const;

export const DEFAULT_BNB_TESTNET_EXPLORER = "https://testnet.bscscan.com" as const;

/**
 * Build a viem chain object for BNB testnet with a configurable RPC + explorer.
 * No production assumptions are baked in — every field can be overridden.
 */
export function createBnbTestnet(options?: { rpcUrl?: string; explorerUrl?: string }) {
  const rpcUrl = options?.rpcUrl ?? DEFAULT_BNB_TESTNET_RPC;
  const explorerUrl = options?.explorerUrl ?? DEFAULT_BNB_TESTNET_EXPLORER;

  return defineChain({
    id: BNB_TESTNET_ID,
    name: "BNB Smart Chain Testnet",
    nativeCurrency: { name: "tBNB", symbol: "tBNB", decimals: 18 },
    rpcUrls: {
      default: { http: [rpcUrl] },
      public: { http: [rpcUrl] },
    },
    blockExplorers: {
      default: { name: "BscScan Testnet", url: explorerUrl },
    },
    testnet: true,
  });
}

export const bnbTestnet = createBnbTestnet();
