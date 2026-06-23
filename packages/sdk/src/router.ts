import type { Address, PublicClient } from "viem";
import { forgeRouterAbi } from "./abis/forgeRouter.js";
import { isValidAddress, toChecksumAddress } from "./addresses.js";
import { ForgeError, mapContractError } from "./errors.js";
import { isRouterConfigured, type ForgeConfig } from "./config.js";
import type { SwapParams, SwapSimulation } from "./types.js";

const BPS_DENOMINATOR = 10_000n;
const MAX_SLIPPAGE_BPS = 5_000; // 50% — a sane upper guard for a testnet UI.

/**
 * Validate raw swap inputs and return normalized {@link SwapParams}.
 * Pure and synchronous — no chain access — so it is cheap to unit test and to
 * run on every keystroke in the demo. Throws a structured ForgeError on any
 * invalid input.
 */
export function validateSwapParams(input: {
  tokenIn: string;
  tokenOut: string;
  amountIn: bigint;
  recipient: string;
  slippageBps: number;
  deadline: bigint;
}): SwapParams {
  const errors: string[] = [];

  if (!isValidAddress(input.tokenIn)) errors.push("tokenIn is not a valid address");
  if (!isValidAddress(input.tokenOut)) errors.push("tokenOut is not a valid address");
  if (!isValidAddress(input.recipient)) errors.push("recipient is not a valid address");
  if (
    isValidAddress(input.tokenIn) &&
    isValidAddress(input.tokenOut) &&
    input.tokenIn.toLowerCase() === input.tokenOut.toLowerCase()
  ) {
    errors.push("tokenIn and tokenOut must differ");
  }
  if (input.amountIn <= 0n) errors.push("amountIn must be greater than zero");
  if (!Number.isInteger(input.slippageBps) || input.slippageBps < 0) {
    errors.push("slippageBps must be a non-negative integer");
  } else if (input.slippageBps > MAX_SLIPPAGE_BPS) {
    errors.push(`slippageBps must be <= ${MAX_SLIPPAGE_BPS}`);
  }
  if (input.deadline <= 0n) errors.push("deadline must be a positive unix timestamp");

  if (errors.length > 0) {
    throw new ForgeError("INVALID_PARAMS", `Invalid swap parameters: ${errors.join("; ")}`, {
      details: { errors },
    });
  }

  return {
    tokenIn: toChecksumAddress(input.tokenIn),
    tokenOut: toChecksumAddress(input.tokenOut),
    amountIn: input.amountIn,
    recipient: toChecksumAddress(input.recipient),
    slippageBps: input.slippageBps,
    deadline: input.deadline,
  };
}

/** Apply slippage tolerance to a quoted output amount. */
export function applySlippage(quotedAmountOut: bigint, slippageBps: number): bigint {
  return (quotedAmountOut * (BPS_DENOMINATOR - BigInt(slippageBps))) / BPS_DENOMINATOR;
}

/** Typed read/simulate-only wrapper around a Forge router. Never broadcasts. */
export class ForgeRouter {
  constructor(
    private readonly client: PublicClient,
    private readonly config: ForgeConfig,
  ) {
    if (!isRouterConfigured(config)) {
      throw new ForgeError("NOT_CONFIGURED", "Router address is not configured");
    }
  }

  get address(): Address {
    return this.config.routerAddress;
  }

  /** Read a quote, or `undefined` if the router doesn't expose `getAmountOut`. */
  async quote(params: SwapParams): Promise<bigint | undefined> {
    try {
      return (await this.client.readContract({
        address: this.address,
        abi: forgeRouterAbi,
        functionName: "getAmountOut",
        args: [params.amountIn, params.tokenIn, params.tokenOut],
      })) as bigint;
    } catch (error) {
      const mapped = mapContractError(error, "router.getAmountOut failed");
      if (mapped.code === "CONTRACT_REVERTED") return undefined;
      throw mapped;
    }
  }

  /**
   * Simulate a swap with viem `simulateContract`. This NEVER broadcasts a
   * transaction — it only asks the node what would happen. Returns a structured
   * {@link SwapSimulation}; throws a structured ForgeError on revert / RPC
   * failure (e.g. INSUFFICIENT_ALLOWANCE, INSUFFICIENT_BALANCE).
   */
  async simulateSwap(params: SwapParams, account: Address): Promise<SwapSimulation> {
    if (!isValidAddress(account)) {
      throw new ForgeError("INVALID_ADDRESS", "Simulation requires a valid account address");
    }

    const quoted = await this.quote(params);
    const amountOutMin = quoted !== undefined ? applySlippage(quoted, params.slippageBps) : 0n;
    const path: Address[] = [params.tokenIn, params.tokenOut];

    try {
      await this.client.simulateContract({
        account,
        address: this.address,
        abi: forgeRouterAbi,
        functionName: "swapExactTokensForTokens",
        args: [params.amountIn, amountOutMin, path, params.recipient, params.deadline],
      });

      const sim: SwapSimulation = { amountIn: params.amountIn, amountOutMin, path };
      if (quoted !== undefined) sim.quotedAmountOut = quoted;
      return sim;
    } catch (error) {
      throw mapContractError(error, "Swap simulation reverted");
    }
  }
}
