import { resolveConfig, type ForgeConfig } from "@forge-trial/sdk";

/**
 * Build the SDK config from NEXT_PUBLIC_* environment variables. All values are
 * public; no secrets are read here. Missing addresses fall back to the zero
 * sentinel, which the UI renders as a "not configured" state.
 */
export function getDemoConfig(): ForgeConfig {
  return resolveConfig({
    chainId: process.env.NEXT_PUBLIC_FORGE_CHAIN_ID
      ? Number(process.env.NEXT_PUBLIC_FORGE_CHAIN_ID)
      : undefined,
    rpcUrl: process.env.NEXT_PUBLIC_FORGE_RPC_URL,
    explorerUrl: process.env.NEXT_PUBLIC_FORGE_EXPLORER_URL,
    factoryAddress: process.env.NEXT_PUBLIC_FORGE_FACTORY_ADDRESS,
    routerAddress: process.env.NEXT_PUBLIC_FORGE_ROUTER_ADDRESS,
    factoryDeployBlock: process.env.NEXT_PUBLIC_FORGE_FACTORY_DEPLOY_BLOCK,
  });
}
