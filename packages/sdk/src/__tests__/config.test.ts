import { describe, expect, it } from "vitest";
import {
  assertExpectedChain,
  configFromEnv,
  isExpectedChain,
  isFactoryConfigured,
  resolveConfig,
} from "../config.js";
import { BNB_TESTNET_ID, createBnbTestnet, DEFAULT_BNB_TESTNET_RPC } from "../chains.js";
import { ForgeError } from "../errors.js";

describe("chain configuration", () => {
  it("defaults to BNB testnet with public RPC", () => {
    const config = resolveConfig();
    expect(config.chainId).toBe(BNB_TESTNET_ID);
    expect(config.rpcUrl).toBe(DEFAULT_BNB_TESTNET_RPC);
    expect(isFactoryConfigured(config)).toBe(false); // zero sentinel by default
  });

  it("is fully overridable (no hardcoded production assumptions)", () => {
    const config = resolveConfig({
      chainId: 97,
      rpcUrl: "https://custom.example/rpc",
      factoryAddress: "0x1111111111111111111111111111111111111111",
      factoryDeployBlock: "12345",
    });
    expect(config.rpcUrl).toBe("https://custom.example/rpc");
    expect(isFactoryConfigured(config)).toBe(true);
    expect(config.factoryDeployBlock).toBe(12345n);
  });

  it("reads config from an env-like record without requiring secrets", () => {
    const config = configFromEnv({
      FORGE_RPC_URL: "https://env.example/rpc",
      FORGE_FACTORY_ADDRESS: "0x2222222222222222222222222222222222222222",
    });
    expect(config.rpcUrl).toBe("https://env.example/rpc");
    expect(config.routerAddress).toBe("0x0000000000000000000000000000000000000000");
  });

  it("builds a viem chain object with configurable RPC", () => {
    const chain = createBnbTestnet({ rpcUrl: "https://x/rpc" });
    expect(chain.id).toBe(97);
    expect(chain.testnet).toBe(true);
    expect(chain.rpcUrls.default.http[0]).toBe("https://x/rpc");
  });

  describe("wrong-chain behavior", () => {
    const config = resolveConfig();
    it("detects mismatched chains", () => {
      expect(isExpectedChain(config, 97)).toBe(true);
      expect(isExpectedChain(config, 56)).toBe(false);
      expect(isExpectedChain(config, undefined)).toBe(false);
    });

    it("throws a structured WRONG_CHAIN error", () => {
      expect(() => assertExpectedChain(config, 56)).toThrowError(ForgeError);
      try {
        assertExpectedChain(config, 1);
      } catch (e) {
        expect(e).toBeInstanceOf(ForgeError);
        expect((e as ForgeError).code).toBe("WRONG_CHAIN");
      }
      expect(() => assertExpectedChain(config, 97)).not.toThrow();
    });
  });
});
