import type { Address } from "viem";

/** Token metadata as read from an ERC-20 contract. */
export interface TokenMetadata {
  address: Address;
  name: string;
  symbol: string;
  decimals: number;
}

/** Normalized pool record produced by the SDK. */
export interface PoolInfo {
  address: Address;
  token0: Address;
  token1: Address;
  /** Numeric pool type as reported on-chain (semantics are deployment-defined). */
  poolType: number;
  /** Fee in basis-point-like units as reported by the contract (uint24). */
  fee: number;
  reserves?: PoolReserves;
}

export interface PoolReserves {
  reserve0: bigint;
  reserve1: bigint;
  blockTimestampLast: number;
}

/** A decoded `PoolCreated` event. */
export interface PoolCreatedEvent {
  token0: Address;
  token1: Address;
  fee: number;
  pool: Address;
  poolType: number;
  blockNumber: bigint;
  logIndex: number;
  transactionHash: `0x${string}`;
}

/** Factory-level configuration read from chain. */
export interface FactoryConfig {
  address: Address;
  owner?: Address;
  feeTo?: Address;
  /** Present only when the deployment exposes `allPoolsLength`. */
  poolCount?: bigint;
}

/** Validated parameters for a swap simulation. */
export interface SwapParams {
  tokenIn: Address;
  tokenOut: Address;
  amountIn: bigint;
  /** Recipient of the output tokens. */
  recipient: Address;
  /** Slippage tolerance in basis points (e.g. 50 = 0.5%). */
  slippageBps: number;
  /** Unix deadline (seconds). */
  deadline: bigint;
}

/** Result of a swap simulation (never broadcast). */
export interface SwapSimulation {
  amountIn: bigint;
  amountOutMin: bigint;
  /** Quoted output before slippage, when the router exposes a quote. */
  quotedAmountOut?: bigint;
  path: Address[];
}
