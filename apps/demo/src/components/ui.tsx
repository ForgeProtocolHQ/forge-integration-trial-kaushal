"use client";

import type { ReactNode } from "react";
import { ForgeError, type ForgeErrorCode } from "@forge-trial/sdk";

export function Banner({ kind, children }: { kind: "warn" | "error" | "ok"; children: ReactNode }) {
  return <div className={`banner ${kind}`}>{children}</div>;
}

/** Human-readable copy for each structured error code. */
const ERROR_COPY: Record<ForgeErrorCode, string> = {
  NOT_CONFIGURED: "Contract addresses are not configured. Set them in your environment.",
  INVALID_ADDRESS: "An address is invalid.",
  INVALID_PARAMS: "The swap parameters are invalid.",
  UNSUPPORTED_METHOD: "This deployment does not support the requested method.",
  CONTRACT_REVERTED: "The contract call reverted.",
  INSUFFICIENT_BALANCE: "Insufficient token balance for this swap.",
  INSUFFICIENT_ALLOWANCE: "Insufficient allowance. Approve the router before swapping.",
  RPC_UNAVAILABLE: "The RPC endpoint is unavailable. Check your network/RPC URL.",
  WRONG_CHAIN: "Wrong network. Switch to BNB testnet.",
  UNKNOWN: "An unexpected error occurred.",
};

export function describeError(error: unknown): { code: ForgeErrorCode; message: string } {
  if (error instanceof ForgeError) {
    return {
      code: error.code,
      message: `${ERROR_COPY[error.code]}${error.reason ? ` (${error.reason})` : ""}`,
    };
  }
  if (error instanceof Error) return { code: "UNKNOWN", message: error.message };
  return { code: "UNKNOWN", message: ERROR_COPY.UNKNOWN };
}

export function ErrorBanner({ error }: { error: unknown }) {
  const { code, message } = describeError(error);
  return (
    <Banner kind="error">
      <strong>{code}</strong> — {message}
    </Banner>
  );
}
