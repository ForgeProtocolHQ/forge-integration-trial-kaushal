"use client";

import { usePublicClient } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import {
  explorerAddressUrl,
  readPoolInfo,
  readTokenMetadata,
  shortenAddress,
  type TokenMetadata,
} from "@forge-trial/sdk";
import { getDemoConfig } from "@/lib/config";
import { ErrorBanner } from "./ui";

const config = getDemoConfig();

export function PoolDetail({ poolAddress }: { poolAddress: string }) {
  const client = usePublicClient();

  const { data, error, isLoading } = useQuery({
    queryKey: ["pool-detail", poolAddress, config.rpcUrl],
    enabled: Boolean(client),
    queryFn: async () => {
      if (!client) throw new Error("No RPC client");
      const info = await readPoolInfo(client, poolAddress);
      const [t0, t1]: [TokenMetadata, TokenMetadata] = await Promise.all([
        readTokenMetadata(client, info.token0),
        readTokenMetadata(client, info.token1),
      ]);
      return { info, t0, t1 };
    },
  });

  if (isLoading) return <p className="muted">Loading pool details…</p>;
  if (error) return <ErrorBanner error={error} />;
  if (!data) return null;

  const { info, t0, t1 } = data;
  return (
    <div>
      <h3>
        {t0.symbol} / {t1.symbol}
      </h3>
      <p className="muted mono">
        <a
          href={explorerAddressUrl(info.address, config.explorerUrl)}
          target="_blank"
          rel="noreferrer"
        >
          {shortenAddress(info.address)}
        </a>
      </p>
      <ul className="muted">
        <li>
          {t0.symbol} ({t0.name}) — {t0.decimals} decimals ·{" "}
          <span className="mono">{shortenAddress(t0.address)}</span>
        </li>
        <li>
          {t1.symbol} ({t1.name}) — {t1.decimals} decimals ·{" "}
          <span className="mono">{shortenAddress(t1.address)}</span>
        </li>
        <li>Pool type: {info.poolType}</li>
        <li>Fee: {info.fee}</li>
        {info.reserves && (
          <li>
            Reserves: {info.reserves.reserve0.toString()} / {info.reserves.reserve1.toString()}
          </li>
        )}
      </ul>
    </div>
  );
}
