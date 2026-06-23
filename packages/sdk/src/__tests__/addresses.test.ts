import { describe, expect, it } from "vitest";
import {
  ZERO_ADDRESS,
  explorerAddressUrl,
  explorerTxUrl,
  isConfiguredAddress,
  isValidAddress,
  isZeroAddress,
  shortenAddress,
  toChecksumAddress,
} from "../addresses.js";

const VALID = "0x1111111111111111111111111111111111111111";
const LOWER = "0xab5801a7d398351b8be11c439e05c5b3259aec9b";

describe("address validation", () => {
  it("accepts valid addresses and rejects junk", () => {
    expect(isValidAddress(VALID)).toBe(true);
    expect(isValidAddress("0x123")).toBe(false);
    expect(isValidAddress("not-an-address")).toBe(false);
    expect(isValidAddress(undefined)).toBe(false);
    expect(isValidAddress(42)).toBe(false);
  });

  it("checksums valid addresses and throws on invalid", () => {
    expect(toChecksumAddress(LOWER)).toBe("0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B");
    expect(() => toChecksumAddress("0xnope")).toThrow(/Invalid EVM address/);
  });

  it("treats the zero address as unconfigured", () => {
    expect(isZeroAddress(ZERO_ADDRESS)).toBe(true);
    expect(isConfiguredAddress(ZERO_ADDRESS)).toBe(false);
    expect(isConfiguredAddress(VALID)).toBe(true);
    expect(isConfiguredAddress(undefined)).toBe(false);
    expect(isConfiguredAddress("garbage")).toBe(false);
  });

  it("builds explorer links and shortens addresses", () => {
    expect(explorerAddressUrl(VALID, "https://testnet.bscscan.com/")).toBe(
      "https://testnet.bscscan.com/address/0x1111111111111111111111111111111111111111",
    );
    expect(explorerTxUrl("0xdead", "https://testnet.bscscan.com")).toBe(
      "https://testnet.bscscan.com/tx/0xdead",
    );
    expect(shortenAddress(VALID)).toBe("0x1111…1111");
  });
});
