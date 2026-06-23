import { describe, expect, it } from "vitest";
import { ContractFunctionRevertedError } from "viem";
import { ForgeError, mapContractError } from "../errors.js";
import { forgeRouterAbi } from "../abis/forgeRouter.js";

function revertWithReason(reason: string): ContractFunctionRevertedError {
  const err = new ContractFunctionRevertedError({
    abi: forgeRouterAbi as never,
    functionName: "swapExactTokensForTokens",
    message: reason,
  });
  // Surface a deterministic reason regardless of viem decoding internals.
  (err as { reason?: string }).reason = reason;
  return err;
}

describe("structured contract-error mapping", () => {
  it("passes ForgeError through unchanged", () => {
    const original = new ForgeError("INVALID_PARAMS", "bad");
    expect(mapContractError(original)).toBe(original);
  });

  it("maps allowance reverts to INSUFFICIENT_ALLOWANCE", () => {
    const mapped = mapContractError(revertWithReason("ERC20: insufficient allowance"));
    expect(mapped).toBeInstanceOf(ForgeError);
    expect(mapped.code).toBe("INSUFFICIENT_ALLOWANCE");
  });

  it("maps balance reverts to INSUFFICIENT_BALANCE", () => {
    const mapped = mapContractError(revertWithReason("transfer amount exceeds balance"));
    expect(mapped.code).toBe("INSUFFICIENT_BALANCE");
  });

  it("maps generic reverts to CONTRACT_REVERTED", () => {
    const mapped = mapContractError(revertWithReason("EXPIRED"));
    expect(mapped.code).toBe("CONTRACT_REVERTED");
    expect(mapped.reason).toBe("EXPIRED");
  });

  it("maps network-ish plain errors to RPC_UNAVAILABLE", () => {
    expect(mapContractError(new Error("fetch failed")).code).toBe("RPC_UNAVAILABLE");
    expect(mapContractError(new Error("request timeout")).code).toBe("RPC_UNAVAILABLE");
  });

  it("falls back to UNKNOWN for unrecognized values", () => {
    expect(mapContractError("weird").code).toBe("UNKNOWN");
    expect(mapContractError(new Error("something odd")).code).toBe("UNKNOWN");
  });
});
