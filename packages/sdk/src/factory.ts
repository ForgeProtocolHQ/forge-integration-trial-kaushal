import type { Address, PublicClient } from "viem";
import { forgeFactoryAbi } from "./abis/forgeFactory.js";
import { toChecksumAddress } from "./addresses.js";
import { ForgeError, mapContractError } from "./errors.js";
import { isFactoryConfigured, type ForgeConfig } from "./config.js";
import { discoverPoolsFromLogs, type DiscoverPoolsOptions } from "./events.js";
import type { FactoryConfig, PoolCreatedEvent } from "./types.js";

/**
 * Typed read-only wrapper around a Forge factory.
 *
 * Enumeration methods (`allPoolsLength`, `allPools`) are OPTIONAL on-chain.
 * The wrapper returns `undefined` (rather than throwing) when a method is not
 * implemented, so callers can fall back to event-log discovery.
 */
export class ForgeFactory {
  constructor(
    private readonly client: PublicClient,
    private readonly config: ForgeConfig,
  ) {
    if (!isFactoryConfigured(config)) {
      throw new ForgeError("NOT_CONFIGURED", "Factory address is not configured");
    }
  }

  get address(): Address {
    return this.config.factoryAddress;
  }

  /** Read factory-level configuration. Optional fields stay undefined if unsupported. */
  async readConfig(): Promise<FactoryConfig> {
    const [owner, feeTo, poolCount] = await Promise.all([
      this.tryRead("owner"),
      this.tryRead("feeTo"),
      this.getPoolCount(),
    ]);

    const result: FactoryConfig = { address: this.address };
    if (owner) result.owner = toChecksumAddress(owner as string);
    if (feeTo) result.feeTo = toChecksumAddress(feeTo as string);
    if (poolCount !== undefined) result.poolCount = poolCount;
    return result;
  }

  /** Returns the pool count, or `undefined` if the factory does not expose it. */
  async getPoolCount(): Promise<bigint | undefined> {
    const value = await this.tryRead("allPoolsLength");
    return value === undefined ? undefined : (value as bigint);
  }

  /**
   * Returns the pool address at `index`, or `undefined` if unsupported.
   * @throws ForgeError(INVALID_PARAMS) for a negative index.
   */
  async getPoolByIndex(index: number | bigint): Promise<Address | undefined> {
    const idx = BigInt(index);
    if (idx < 0n) {
      throw new ForgeError("INVALID_PARAMS", "Pool index must be non-negative", {
        details: { index: idx.toString() },
      });
    }
    const value = await this.tryRead("allPools", [idx]);
    return value === undefined ? undefined : toChecksumAddress(value as string);
  }

  /** Discover historical pools via `PoolCreated` logs from the configured start block. */
  async discoverPools(options?: DiscoverPoolsOptions): Promise<PoolCreatedEvent[]> {
    return discoverPoolsFromLogs(this.client, this.config, options);
  }

  /**
   * Read a factory method, returning `undefined` when the method is not
   * implemented by the deployment, and re-throwing real failures (RPC, revert)
   * as a structured ForgeError.
   */
  private async tryRead(
    functionName: "owner" | "feeTo" | "allPoolsLength" | "allPools",
    args: readonly unknown[] = [],
  ): Promise<unknown> {
    try {
      return await this.client.readContract({
        address: this.address,
        abi: forgeFactoryAbi,
        functionName,
        args: args as never,
      });
    } catch (error) {
      const mapped = mapContractError(error, `factory.${functionName} failed`);
      // A revert here most often means "method not present on this deployment".
      if (mapped.code === "CONTRACT_REVERTED") return undefined;
      throw mapped;
    }
  }
}
