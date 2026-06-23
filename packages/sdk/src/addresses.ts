import { getAddress, isAddress, type Address } from "viem";
import { DEFAULT_BNB_TESTNET_EXPLORER } from "./chains.js";

export const ZERO_ADDRESS: Address = "0x0000000000000000000000000000000000000000";

/** Returns true if `value` is a syntactically valid EVM address. */
export function isValidAddress(value: unknown): value is Address {
  return typeof value === "string" && isAddress(value);
}

/** True for the zero address (used as the "not configured" sentinel). */
export function isZeroAddress(value: string): boolean {
  return isValidAddress(value) && getAddress(value) === ZERO_ADDRESS;
}

/**
 * Normalize to a checksummed address or throw a typed error.
 * @throws Error when `value` is not a valid address.
 */
export function toChecksumAddress(value: string): Address {
  if (!isValidAddress(value)) {
    throw new Error(`Invalid EVM address: ${String(value)}`);
  }
  return getAddress(value);
}

/** True when an address is present, valid, and not the zero sentinel. */
export function isConfiguredAddress(value: string | undefined | null): value is string {
  return typeof value === "string" && isValidAddress(value) && !isZeroAddress(value);
}

/** Build a block-explorer link for an address. */
export function explorerAddressUrl(
  address: string,
  explorerUrl: string = DEFAULT_BNB_TESTNET_EXPLORER,
): string {
  return `${explorerUrl.replace(/\/$/, "")}/address/${address}`;
}

/** Build a block-explorer link for a transaction hash. */
export function explorerTxUrl(
  txHash: string,
  explorerUrl: string = DEFAULT_BNB_TESTNET_EXPLORER,
): string {
  return `${explorerUrl.replace(/\/$/, "")}/tx/${txHash}`;
}

/** Truncate an address for display: 0x1234…abcd. */
export function shortenAddress(address: string, chars = 4): string {
  if (!isValidAddress(address)) return address;
  return `${address.slice(0, 2 + chars)}…${address.slice(-chars)}`;
}
