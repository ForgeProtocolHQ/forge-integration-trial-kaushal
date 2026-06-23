/**
 * Minimal, illustrative ABI for a Forge factory contract on BNB testnet.
 *
 * This is a PUBLIC interface shape only (generic AMM-style factory). It does
 * not contain or reveal proprietary Forge contract source. All functions are
 * treated as OPTIONAL by the SDK: callers must tolerate a contract that does
 * not implement `allPoolsLength` / `allPools`, since not every deployment
 * exposes enumeration.
 */
export const forgeFactoryAbi = [
  {
    type: "function",
    name: "feeTo",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "owner",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "allPoolsLength",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "allPools",
    stateMutability: "view",
    inputs: [{ name: "index", type: "uint256" }],
    outputs: [{ name: "pool", type: "address" }],
  },
  {
    type: "function",
    name: "getPool",
    stateMutability: "view",
    inputs: [
      { name: "tokenA", type: "address" },
      { name: "tokenB", type: "address" },
      { name: "fee", type: "uint24" },
    ],
    outputs: [{ name: "pool", type: "address" }],
  },
  {
    type: "event",
    name: "PoolCreated",
    inputs: [
      { name: "token0", type: "address", indexed: true },
      { name: "token1", type: "address", indexed: true },
      { name: "fee", type: "uint24", indexed: true },
      { name: "pool", type: "address", indexed: false },
      { name: "poolType", type: "uint8", indexed: false },
    ],
    anonymous: false,
  },
] as const;
