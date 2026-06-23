import type { Address, PublicClient } from "viem";
import { forgePoolAbi } from "./abis/forgePool.js";
import { erc20Abi } from "./abis/erc20.js";
import { isValidAddress, toChecksumAddress } from "./addresses.js";
import { ForgeError, mapContractError } from "./errors.js";
import type { PoolInfo, PoolReserves, TokenMetadata } from "./types.js";

/** Read normalized pool information. Reserves are optional (best-effort). */
export async function readPoolInfo(client: PublicClient, poolAddress: string): Promise<PoolInfo> {
  if (!isValidAddress(poolAddress)) {
    throw new ForgeError("INVALID_ADDRESS", `Invalid pool address: ${String(poolAddress)}`, {
      details: { poolAddress },
    });
  }
  const address = toChecksumAddress(poolAddress);

  try {
    const [token0, token1, poolType, fee] = await Promise.all([
      client.readContract({ address, abi: forgePoolAbi, functionName: "token0" }),
      client.readContract({ address, abi: forgePoolAbi, functionName: "token1" }),
      client.readContract({ address, abi: forgePoolAbi, functionName: "poolType" }),
      client.readContract({ address, abi: forgePoolAbi, functionName: "fee" }),
    ]);

    const reserves = await readReserves(client, address);

    const info: PoolInfo = {
      address,
      token0: toChecksumAddress(token0 as string),
      token1: toChecksumAddress(token1 as string),
      poolType: Number(poolType),
      fee: Number(fee),
    };
    if (reserves) info.reserves = reserves;
    return info;
  } catch (error) {
    throw mapContractError(error, "Failed to read pool info");
  }
}

/** Best-effort reserves read; returns `undefined` if the pool doesn't expose them. */
export async function readReserves(
  client: PublicClient,
  poolAddress: Address,
): Promise<PoolReserves | undefined> {
  try {
    const [reserve0, reserve1, blockTimestampLast] = (await client.readContract({
      address: poolAddress,
      abi: forgePoolAbi,
      functionName: "getReserves",
    })) as readonly [bigint, bigint, number];
    return { reserve0, reserve1, blockTimestampLast: Number(blockTimestampLast) };
  } catch {
    return undefined;
  }
}

/** Read ERC-20 token metadata. */
export async function readTokenMetadata(
  client: PublicClient,
  tokenAddress: string,
): Promise<TokenMetadata> {
  if (!isValidAddress(tokenAddress)) {
    throw new ForgeError("INVALID_ADDRESS", `Invalid token address: ${String(tokenAddress)}`, {
      details: { tokenAddress },
    });
  }
  const address = toChecksumAddress(tokenAddress);
  try {
    const [name, symbol, decimals] = await Promise.all([
      client.readContract({ address, abi: erc20Abi, functionName: "name" }),
      client.readContract({ address, abi: erc20Abi, functionName: "symbol" }),
      client.readContract({ address, abi: erc20Abi, functionName: "decimals" }),
    ]);
    return {
      address,
      name: name as string,
      symbol: symbol as string,
      decimals: Number(decimals),
    };
  } catch (error) {
    throw mapContractError(error, "Failed to read token metadata");
  }
}
