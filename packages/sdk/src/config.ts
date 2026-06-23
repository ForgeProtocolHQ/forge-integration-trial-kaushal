import type { Address } from "viem";
import { BNB_TESTNET_ID, DEFAULT_BNB_TESTNET_EXPLORER, DEFAULT_BNB_TESTNET_RPC } from "./chains.js";
import { isConfiguredAddress, toChecksumAddress, ZERO_ADDRESS } from "./addresses.js";
import { ForgeError } from "./errors.js";

/**
 * Fully resolved SDK configuration. Addresses may be the zero sentinel, which
 * means "not configured" — the SDK surfaces a NOT_CONFIGURED error rather than
 * fabricating data.
 */
export interface ForgeConfig {
  chainId: number;
  rpcUrl: string;
  explorerUrl: string;
  factoryAddress: Address;
  routerAddress: Address;
  /** Block to begin historical pool discovery from. */
  factoryDeployBlock: bigint;
}

export interface ForgeConfigInput {
  chainId?: number | undefined;
  rpcUrl?: string | undefined;
  explorerUrl?: string | undefined;
  factoryAddress?: string | undefined;
  routerAddress?: string | undefined;
  factoryDeployBlock?: bigint | number | string | undefined;
}

function normalizeAddress(value: string | undefined): Address {
  if (!value || value.trim() === "") return ZERO_ADDRESS;
  return toChecksumAddress(value.trim());
}

function normalizeBlock(value: bigint | number | string | undefined): bigint {
  if (value === undefined || value === "") return 0n;
  try {
    return BigInt(value);
  } catch {
    return 0n;
  }
}

/**
 * Resolve configuration from explicit input, falling back to public defaults.
 * No secrets are read or required. Throws only on a malformed (non-empty)
 * address, which is a programmer error worth surfacing early.
 */
export function resolveConfig(input: ForgeConfigInput = {}): ForgeConfig {
  return {
    chainId: input.chainId ?? BNB_TESTNET_ID,
    rpcUrl: input.rpcUrl?.trim() || DEFAULT_BNB_TESTNET_RPC,
    explorerUrl: input.explorerUrl?.trim() || DEFAULT_BNB_TESTNET_EXPLORER,
    factoryAddress: normalizeAddress(input.factoryAddress),
    routerAddress: normalizeAddress(input.routerAddress),
    factoryDeployBlock: normalizeBlock(input.factoryDeployBlock),
  };
}

/** Convenience helper: build config from a `process.env`-like record. */
export function configFromEnv(env: Record<string, string | undefined>): ForgeConfig {
  return resolveConfig({
    chainId: env.FORGE_CHAIN_ID ? Number(env.FORGE_CHAIN_ID) : undefined,
    rpcUrl: env.FORGE_RPC_URL,
    explorerUrl: env.FORGE_EXPLORER_URL,
    factoryAddress: env.FORGE_FACTORY_ADDRESS,
    routerAddress: env.FORGE_ROUTER_ADDRESS,
    factoryDeployBlock: env.FORGE_FACTORY_DEPLOY_BLOCK,
  });
}

export function isFactoryConfigured(config: ForgeConfig): boolean {
  return isConfiguredAddress(config.factoryAddress);
}

export function isRouterConfigured(config: ForgeConfig): boolean {
  return isConfiguredAddress(config.routerAddress);
}

/** True when the connected wallet/client chain matches the configured chain. */
export function isExpectedChain(config: ForgeConfig, actualChainId: number | undefined): boolean {
  return actualChainId !== undefined && actualChainId === config.chainId;
}

/**
 * Throw a structured WRONG_CHAIN error if the connected chain does not match.
 * Used by the demo's network guard and unit-tested directly.
 */
export function assertExpectedChain(config: ForgeConfig, actualChainId: number | undefined): void {
  if (!isExpectedChain(config, actualChainId)) {
    throw new ForgeError(
      "WRONG_CHAIN",
      `Wrong network: expected chain ${config.chainId}, got ${actualChainId ?? "unknown"}`,
      { details: { expected: config.chainId, actual: actualChainId } },
    );
  }
}
