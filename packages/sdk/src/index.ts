/**
 * @forge-trial/sdk — typed, read/simulate-only wrappers for Forge Protocol on
 * BNB testnet.
 *
 * EVALUATION / TRIAL SOFTWARE. Not production-ready. The SDK never holds a
 * signer or private key and never broadcasts transactions.
 */

// Chain + client
export {
  BNB_TESTNET_ID,
  DEFAULT_BNB_TESTNET_RPC,
  DEFAULT_BNB_TESTNET_EXPLORER,
  createBnbTestnet,
  bnbTestnet,
} from "./chains.js";
export { createForgePublicClient } from "./client.js";

// Config
export {
  resolveConfig,
  configFromEnv,
  isFactoryConfigured,
  isRouterConfigured,
  isExpectedChain,
  assertExpectedChain,
  type ForgeConfig,
  type ForgeConfigInput,
} from "./config.js";

// Addresses
export {
  ZERO_ADDRESS,
  isValidAddress,
  isZeroAddress,
  isConfiguredAddress,
  toChecksumAddress,
  explorerAddressUrl,
  explorerTxUrl,
  shortenAddress,
} from "./addresses.js";

// Errors
export {
  ForgeError,
  mapContractError,
  isHexData,
  type ForgeErrorCode,
  type ForgeErrorOptions,
} from "./errors.js";

// Events / discovery
export {
  poolCreatedEvent,
  decodePoolCreatedLog,
  dedupePoolEvents,
  discoverPoolsFromLogs,
  type DiscoverPoolsOptions,
} from "./events.js";

// Factory / Router / Pool
export { ForgeFactory } from "./factory.js";
export { ForgeRouter, validateSwapParams, applySlippage } from "./router.js";
export { readPoolInfo, readReserves, readTokenMetadata } from "./pool.js";

// ABIs
export { forgeFactoryAbi, forgeRouterAbi, forgePoolAbi, erc20Abi } from "./abis/index.js";

// Types
export type {
  TokenMetadata,
  PoolInfo,
  PoolReserves,
  PoolCreatedEvent,
  FactoryConfig,
  SwapParams,
  SwapSimulation,
} from "./types.js";
