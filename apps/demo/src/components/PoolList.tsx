"use client";

import { usePublicClient } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import {
  discoverPoolsFromLogs,
  isFactoryConfigured,
  shortenAddress,
  type PoolCreatedEvent,
} from "@forge-trial/sdk";
import { getDemoConfig } from "@/lib/config";
import { Banner, ErrorBanner } from "./ui";

const config = getDemoConfig();

export function PoolList({
  selected,
  onSelect,
}: {
  selected: string | null;
  onSelect: (pool: PoolCreatedEvent) => void;
}) {
  const client = usePublicClient();

  const { data, error, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["pools", config.factoryAddress, config.rpcUrl],
    enabled: isFactoryConfigured(config) && Boolean(client),
    queryFn: async () => {
      if (!client) throw new Error("No RPC client");
      return discoverPoolsFromLogs(client, config);
    },
  });

  return (
    <div className="panel">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h2>Detected Forge Pools</h2>
        <button className="secondary" onClick={() => refetch()} disabled={isFetching}>
          {isFetching ? "Scanning…" : "Refresh"}
        </button>
      </div>

      {!isFactoryConfigured(config) && (
        <Banner kind="warn">
          Factory address is not configured. Set{" "}
          <span className="mono">NEXT_PUBLIC_FORGE_FACTORY_ADDRESS</span> to a deployed BNB testnet
          factory to discover pools.
        </Banner>
      )}

      {isLoading && <p className="muted">Scanning PoolCreated events…</p>}
      {error && <ErrorBanner error={error} />}

      {data && data.length === 0 && <p className="muted">No pools found in the scanned range.</p>}

      {data &&
        data.map((pool) => (
          <div
            key={pool.pool}
            className={`pool-item ${selected === pool.pool ? "active" : ""}`}
            onClick={() => onSelect(pool)}
          >
            <span className="mono">{shortenAddress(pool.pool)}</span>
            <span className="badge">
              type {pool.poolType} · fee {pool.fee}
            </span>
          </div>
        ))}
    </div>
  );
}
