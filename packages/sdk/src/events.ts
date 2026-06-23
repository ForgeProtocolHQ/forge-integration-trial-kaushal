import { decodeEventLog, getAbiItem, type Address, type Log, type PublicClient } from "viem";
import { forgeFactoryAbi } from "./abis/forgeFactory.js";
import { toChecksumAddress } from "./addresses.js";
import { ForgeError, mapContractError } from "./errors.js";
import type { ForgeConfig } from "./config.js";
import { isFactoryConfigured } from "./config.js";
import type { PoolCreatedEvent } from "./types.js";

export const poolCreatedEvent = getAbiItem({ abi: forgeFactoryAbi, name: "PoolCreated" });

/**
 * Decode a single `PoolCreated` log into a structured event.
 * Returns `null` for logs that don't match the event (defensive: callers may
 * pass a mixed log set).
 */
export function decodePoolCreatedLog(
  log: Pick<Log, "topics" | "data" | "blockNumber" | "logIndex" | "transactionHash">,
): PoolCreatedEvent | null {
  try {
    const decoded = decodeEventLog({
      abi: forgeFactoryAbi,
      data: log.data,
      topics: log.topics,
    });
    if (decoded.eventName !== "PoolCreated") return null;
    const args = decoded.args as {
      token0: Address;
      token1: Address;
      fee: number;
      pool: Address;
      poolType: number;
    };
    return {
      token0: toChecksumAddress(args.token0),
      token1: toChecksumAddress(args.token1),
      fee: Number(args.fee),
      pool: toChecksumAddress(args.pool),
      poolType: Number(args.poolType),
      blockNumber: log.blockNumber ?? 0n,
      logIndex: log.logIndex ?? 0,
      transactionHash: log.transactionHash ?? "0x",
    };
  } catch {
    return null;
  }
}

/**
 * De-duplicate decoded pool events by pool address, keeping the FIRST
 * occurrence (earliest block / log index when sorted). A factory may emit the
 * same pool more than once across re-orgs or overlapping queries.
 */
export function dedupePoolEvents(events: PoolCreatedEvent[]): PoolCreatedEvent[] {
  const sorted = [...events].sort((a, b) => {
    if (a.blockNumber !== b.blockNumber) return a.blockNumber < b.blockNumber ? -1 : 1;
    return a.logIndex - b.logIndex;
  });
  const seen = new Set<string>();
  const out: PoolCreatedEvent[] = [];
  for (const ev of sorted) {
    const key = ev.pool.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(ev);
  }
  return out;
}

export interface DiscoverPoolsOptions {
  fromBlock?: bigint;
  toBlock?: bigint | "latest";
  /** Max blocks per getLogs page (some RPCs cap range). */
  pageSize?: bigint;
}

/**
 * Discover historical pools by scanning `PoolCreated` logs from a configurable
 * start block. Pages through the range to respect RPC limits and de-dupes the
 * result. Throws a {@link ForgeError} (`NOT_CONFIGURED`) if no factory address
 * is set — never fabricates pools.
 */
export async function discoverPoolsFromLogs(
  client: PublicClient,
  config: ForgeConfig,
  options: DiscoverPoolsOptions = {},
): Promise<PoolCreatedEvent[]> {
  if (!isFactoryConfigured(config)) {
    throw new ForgeError("NOT_CONFIGURED", "Factory address is not configured", {
      details: { factoryAddress: config.factoryAddress },
    });
  }

  const fromBlock = options.fromBlock ?? config.factoryDeployBlock;
  const pageSize = options.pageSize ?? 5_000n;

  try {
    const latest =
      options.toBlock && options.toBlock !== "latest"
        ? options.toBlock
        : await client.getBlockNumber();

    const collected: PoolCreatedEvent[] = [];
    for (let start = fromBlock; start <= latest; start += pageSize) {
      const end = start + pageSize - 1n > latest ? latest : start + pageSize - 1n;
      const logs = await client.getLogs({
        address: config.factoryAddress,
        event: poolCreatedEvent,
        fromBlock: start,
        toBlock: end,
      });
      for (const log of logs) {
        const decoded = decodePoolCreatedLog(log);
        if (decoded) collected.push(decoded);
      }
    }
    return dedupePoolEvents(collected);
  } catch (error) {
    throw mapContractError(error, "Failed to discover pools from logs");
  }
}
