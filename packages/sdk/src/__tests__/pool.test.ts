import { describe, expect, it } from "vitest";
import type { PublicClient } from "viem";
import { readPoolInfo, readTokenMetadata } from "../pool.js";
import { ForgeError } from "../errors.js";

const POOL = "0x5555555555555555555555555555555555555555";
const TOKEN0 = "0x1111111111111111111111111111111111111111";
const TOKEN1 = "0x2222222222222222222222222222222222222222";

function poolClient(overrides: Record<string, unknown> = {}): PublicClient {
  const responses: Record<string, unknown> = {
    token0: TOKEN0,
    token1: TOKEN1,
    poolType: 1,
    fee: 3000,
    getReserves: [100n, 200n, 1_700_000_000],
    name: "Mock Token",
    symbol: "MOCK",
    decimals: 18,
    ...overrides,
  };
  return {
    readContract: async ({ functionName }: { functionName: string }) => {
      if (functionName in responses) return responses[functionName];
      throw new Error("execution reverted");
    },
  } as unknown as PublicClient;
}

describe("pool-data normalization", () => {
  it("normalizes pool fields and checksums token addresses", async () => {
    const info = await readPoolInfo(poolClient(), POOL);
    expect(info.token0.toLowerCase()).toBe(TOKEN0);
    expect(info.token1.toLowerCase()).toBe(TOKEN1);
    expect(info.poolType).toBe(1);
    expect(info.fee).toBe(3000);
    expect(info.reserves).toEqual({
      reserve0: 100n,
      reserve1: 200n,
      blockTimestampLast: 1_700_000_000,
    });
  });

  it("omits reserves when the pool does not expose getReserves", async () => {
    const client = poolClient({ getReserves: undefined });
    // override to throw for getReserves
    const throwing = {
      readContract: async ({ functionName }: { functionName: string }) => {
        if (functionName === "getReserves") throw new Error("no method");
        return (
          client as unknown as { readContract: (a: { functionName: string }) => Promise<unknown> }
        ).readContract({ functionName });
      },
    } as unknown as PublicClient;
    const info = await readPoolInfo(throwing, POOL);
    expect(info.reserves).toBeUndefined();
  });

  it("rejects an invalid pool address with INVALID_ADDRESS", async () => {
    await expect(readPoolInfo(poolClient(), "0xnope")).rejects.toMatchObject({
      code: "INVALID_ADDRESS",
    });
  });

  it("reads ERC-20 token metadata", async () => {
    const meta = await readTokenMetadata(poolClient(), TOKEN0);
    expect(meta.symbol).toBe("MOCK");
    expect(meta.decimals).toBe(18);
    expect(meta.address.toLowerCase()).toBe(TOKEN0);
  });

  it("rejects invalid token addresses", async () => {
    await expect(readTokenMetadata(poolClient(), "bad")).rejects.toBeInstanceOf(ForgeError);
  });
});
