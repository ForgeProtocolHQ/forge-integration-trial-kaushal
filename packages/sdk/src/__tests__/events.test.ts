import { describe, expect, it } from "vitest";
import { encodeAbiParameters, encodeEventTopics, type PublicClient } from "viem";
import { forgeFactoryAbi } from "../abis/forgeFactory.js";
import { decodePoolCreatedLog, dedupePoolEvents, discoverPoolsFromLogs } from "../events.js";
import { resolveConfig } from "../config.js";
import { ForgeError } from "../errors.js";
import type { PoolCreatedEvent } from "../types.js";

const TOKEN0 = "0x1111111111111111111111111111111111111111";
const TOKEN1 = "0x2222222222222222222222222222222222222222";
const POOL_A = "0x3333333333333333333333333333333333333333";
const POOL_B = "0x4444444444444444444444444444444444444444";

function makeLog(pool: string, opts: { blockNumber: bigint; logIndex: number }) {
  // viem (this version) has no encodeEventLog; build topics + data manually.
  const topics = encodeEventTopics({
    abi: forgeFactoryAbi,
    eventName: "PoolCreated",
    args: { token0: TOKEN0, token1: TOKEN1, fee: 3000 },
  });
  const data = encodeAbiParameters(
    [
      { name: "pool", type: "address" },
      { name: "poolType", type: "uint8" },
    ],
    [pool as `0x${string}`, 1],
  );
  return {
    topics,
    data,
    blockNumber: opts.blockNumber,
    logIndex: opts.logIndex,
    transactionHash: "0xabc" as `0x${string}`,
  };
}

describe("event decoding", () => {
  it("decodes a PoolCreated log into a normalized event", () => {
    const decoded = decodePoolCreatedLog(makeLog(POOL_A, { blockNumber: 10n, logIndex: 0 }));
    expect(decoded).not.toBeNull();
    expect(decoded?.pool.toLowerCase()).toBe(POOL_A);
    expect(decoded?.token0.toLowerCase()).toBe(TOKEN0);
    expect(decoded?.fee).toBe(3000);
    expect(decoded?.poolType).toBe(1);
    expect(decoded?.blockNumber).toBe(10n);
  });

  it("returns null for a non-matching / malformed log", () => {
    expect(
      decodePoolCreatedLog({
        topics: ["0xdeadbeef"],
        data: "0x",
        blockNumber: 1n,
        logIndex: 0,
        transactionHash: "0x",
      } as never),
    ).toBeNull();
  });
});

describe("duplicate pool-event handling", () => {
  it("keeps the earliest occurrence per pool and sorts by block/logIndex", () => {
    const events: PoolCreatedEvent[] = [
      decodePoolCreatedLog(makeLog(POOL_A, { blockNumber: 20n, logIndex: 1 }))!,
      decodePoolCreatedLog(makeLog(POOL_A, { blockNumber: 10n, logIndex: 0 }))!, // dup, earlier
      decodePoolCreatedLog(makeLog(POOL_B, { blockNumber: 15n, logIndex: 0 }))!,
    ];
    const deduped = dedupePoolEvents(events);
    expect(deduped).toHaveLength(2);
    expect(deduped[0]?.pool.toLowerCase()).toBe(POOL_A);
    expect(deduped[0]?.blockNumber).toBe(10n);
    expect(deduped[1]?.pool.toLowerCase()).toBe(POOL_B);
  });
});

describe("mocked pool-discovery flow", () => {
  const config = resolveConfig({
    factoryAddress: "0x5555555555555555555555555555555555555555",
    factoryDeployBlock: 0,
  });

  it("succeeds: pages logs, decodes and de-dupes", async () => {
    const client = {
      getBlockNumber: async () => 100n,
      getLogs: async () => [
        makeLog(POOL_A, { blockNumber: 5n, logIndex: 0 }),
        makeLog(POOL_A, { blockNumber: 6n, logIndex: 0 }), // duplicate
        makeLog(POOL_B, { blockNumber: 7n, logIndex: 0 }),
      ],
    } as unknown as PublicClient;

    const pools = await discoverPoolsFromLogs(client, config, { pageSize: 1_000n });
    expect(pools).toHaveLength(2);
    expect(pools.map((p) => p.pool.toLowerCase()).sort()).toEqual([POOL_A, POOL_B].sort());
  });

  it("fails closed when the RPC throws (no fabricated data)", async () => {
    const client = {
      getBlockNumber: async () => 100n,
      getLogs: async () => {
        throw new Error("http request failed: network unreachable");
      },
    } as unknown as PublicClient;

    await expect(discoverPoolsFromLogs(client, config)).rejects.toBeInstanceOf(ForgeError);
    await expect(discoverPoolsFromLogs(client, config)).rejects.toMatchObject({
      code: "RPC_UNAVAILABLE",
    });
  });

  it("refuses to discover when the factory is not configured", async () => {
    const unconfigured = resolveConfig();
    const client = {
      getBlockNumber: async () => 1n,
      getLogs: async () => [],
    } as unknown as PublicClient;
    await expect(discoverPoolsFromLogs(client, unconfigured)).rejects.toMatchObject({
      code: "NOT_CONFIGURED",
    });
  });
});
