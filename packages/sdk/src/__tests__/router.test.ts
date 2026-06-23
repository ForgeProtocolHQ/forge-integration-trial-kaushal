import { describe, expect, it } from "vitest";
import type { Address, PublicClient } from "viem";
import { ForgeRouter, applySlippage, validateSwapParams } from "../router.js";
import { resolveConfig } from "../config.js";
import { ForgeError } from "../errors.js";

const TOKEN_IN = "0x1111111111111111111111111111111111111111";
const TOKEN_OUT = "0x2222222222222222222222222222222222222222";
const ACCOUNT = "0x3333333333333333333333333333333333333333" as Address;
const ROUTER = "0x4444444444444444444444444444444444444444";

const baseInput = {
  tokenIn: TOKEN_IN,
  tokenOut: TOKEN_OUT,
  amountIn: 1_000n,
  recipient: ACCOUNT,
  slippageBps: 50,
  deadline: 9_999_999_999n,
};

describe("router simulation input validation", () => {
  it("accepts well-formed params and checksums addresses", () => {
    const params = validateSwapParams(baseInput);
    expect(params.amountIn).toBe(1_000n);
    expect(params.tokenIn.startsWith("0x")).toBe(true);
  });

  it("rejects identical tokens", () => {
    expect(() => validateSwapParams({ ...baseInput, tokenOut: TOKEN_IN })).toThrowError(ForgeError);
  });

  it("rejects non-positive amount and bad slippage", () => {
    expect(() => validateSwapParams({ ...baseInput, amountIn: 0n })).toThrow(/amountIn/);
    expect(() => validateSwapParams({ ...baseInput, slippageBps: -1 })).toThrow(/slippageBps/);
    expect(() => validateSwapParams({ ...baseInput, slippageBps: 9999 })).toThrow(/slippageBps/);
  });

  it("rejects invalid addresses", () => {
    expect(() => validateSwapParams({ ...baseInput, recipient: "0xnope" })).toThrowError(
      ForgeError,
    );
  });

  it("applies slippage in basis points", () => {
    expect(applySlippage(10_000n, 50)).toBe(9_950n); // 0.5%
    expect(applySlippage(10_000n, 0)).toBe(10_000n);
  });
});

describe("ForgeRouter.simulateSwap (mocked, never broadcasts)", () => {
  const config = resolveConfig({ routerAddress: ROUTER });

  it("returns a structured simulation on success", async () => {
    const client = {
      readContract: async () => 2_000n, // getAmountOut quote
      simulateContract: async () => ({ result: [1_000n, 2_000n] }),
    } as unknown as PublicClient;

    const router = new ForgeRouter(client, config);
    const sim = await router.simulateSwap(validateSwapParams(baseInput), ACCOUNT);
    expect(sim.quotedAmountOut).toBe(2_000n);
    expect(sim.amountOutMin).toBe(applySlippage(2_000n, 50));
    expect(sim.path).toEqual([
      validateSwapParams(baseInput).tokenIn,
      validateSwapParams(baseInput).tokenOut,
    ]);
  });

  it("maps a simulation revert to a structured ForgeError", async () => {
    const client = {
      readContract: async () => 2_000n,
      simulateContract: async () => {
        throw new Error("execution reverted");
      },
    } as unknown as PublicClient;

    const router = new ForgeRouter(client, config);
    await expect(
      router.simulateSwap(validateSwapParams(baseInput), ACCOUNT),
    ).rejects.toBeInstanceOf(ForgeError);
  });

  it("refuses to construct when the router is unconfigured", () => {
    expect(() => new ForgeRouter({} as PublicClient, resolveConfig())).toThrowError(ForgeError);
  });
});
