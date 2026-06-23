import { createPublicClient, http, type PublicClient } from "viem";
import { createBnbTestnet } from "./chains.js";
import type { ForgeConfig } from "./config.js";

/**
 * Create a read-only viem public client for the configured chain.
 *
 * The SDK is read/simulate-only: it never constructs a wallet client and never
 * holds a signer or private key. Transaction execution, if ever desired, is the
 * caller's responsibility in the application layer.
 */
export function createForgePublicClient(config: ForgeConfig): PublicClient {
  const chain = createBnbTestnet({ rpcUrl: config.rpcUrl, explorerUrl: config.explorerUrl });
  return createPublicClient({
    chain,
    transport: http(config.rpcUrl),
  });
}
