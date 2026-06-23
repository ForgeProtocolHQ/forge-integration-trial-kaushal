import {
  BaseError,
  ContractFunctionRevertedError,
  ContractFunctionExecutionError,
  type Hex,
} from "viem";

/** Stable, machine-readable error codes surfaced by the SDK. */
export type ForgeErrorCode =
  | "NOT_CONFIGURED"
  | "INVALID_ADDRESS"
  | "INVALID_PARAMS"
  | "UNSUPPORTED_METHOD"
  | "CONTRACT_REVERTED"
  | "INSUFFICIENT_BALANCE"
  | "INSUFFICIENT_ALLOWANCE"
  | "RPC_UNAVAILABLE"
  | "WRONG_CHAIN"
  | "UNKNOWN";

export interface ForgeErrorOptions {
  cause?: unknown;
  /** Decoded revert reason / signature, when available. */
  reason?: string;
  /** Extra structured context (params, addresses, etc.). */
  details?: Record<string, unknown>;
}

/**
 * Standardized error type. Every SDK function that talks to the chain either
 * resolves successfully or rejects with a `ForgeError` carrying a stable
 * `code`, so UIs can branch on `code` instead of string-matching messages.
 */
export class ForgeError extends Error {
  readonly code: ForgeErrorCode;
  readonly reason: string | undefined;
  readonly details: Record<string, unknown> | undefined;

  constructor(code: ForgeErrorCode, message: string, options: ForgeErrorOptions = {}) {
    super(message, options.cause !== undefined ? { cause: options.cause } : undefined);
    this.name = "ForgeError";
    this.code = code;
    this.reason = options.reason;
    this.details = options.details;
  }
}

const REVERT_REASON_HINTS: Array<{ match: RegExp; code: ForgeErrorCode }> = [
  { match: /insufficient.*allowance|allowance/i, code: "INSUFFICIENT_ALLOWANCE" },
  {
    match: /insufficient.*(balance|funds|amount)|transfer amount exceeds balance/i,
    code: "INSUFFICIENT_BALANCE",
  },
];

/**
 * Map an arbitrary thrown value (typically a viem error) into a structured
 * {@link ForgeError}. This is the single chokepoint the SDK uses so callers
 * always receive a predictable shape.
 */
export function mapContractError(
  error: unknown,
  fallbackMessage = "Contract call failed",
): ForgeError {
  if (error instanceof ForgeError) return error;

  if (error instanceof BaseError) {
    const revert = error.walk((e) => e instanceof ContractFunctionRevertedError) as
      | ContractFunctionRevertedError
      | undefined;

    if (revert) {
      const reason = revert.data?.errorName ?? revert.reason ?? revert.shortMessage ?? "reverted";
      for (const hint of REVERT_REASON_HINTS) {
        if (hint.match.test(reason)) {
          return new ForgeError(hint.code, reason, { cause: error, reason });
        }
      }
      return new ForgeError("CONTRACT_REVERTED", reason, { cause: error, reason });
    }

    const execErr = error.walk((e) => e instanceof ContractFunctionExecutionError);
    const message = error.shortMessage || error.message || fallbackMessage;

    if (
      /http request failed|fetch failed|timed out|network|econnrefused|getaddrinfo/i.test(message)
    ) {
      return new ForgeError("RPC_UNAVAILABLE", message, { cause: error });
    }
    if (execErr) {
      return new ForgeError("CONTRACT_REVERTED", message, { cause: error });
    }
    return new ForgeError("UNKNOWN", message, { cause: error });
  }

  if (error instanceof Error) {
    if (/network|fetch|timeout|rpc/i.test(error.message)) {
      return new ForgeError("RPC_UNAVAILABLE", error.message, { cause: error });
    }
    return new ForgeError("UNKNOWN", error.message, { cause: error });
  }

  return new ForgeError("UNKNOWN", fallbackMessage, { cause: error });
}

/** Type guard for revert signature payloads (used in tests / advanced UIs). */
export function isHexData(value: unknown): value is Hex {
  return typeof value === "string" && /^0x[0-9a-fA-F]*$/.test(value);
}
