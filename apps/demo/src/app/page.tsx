"use client";

import { useState } from "react";
import type { PoolCreatedEvent } from "@forge-trial/sdk";
import { WalletBar } from "@/components/WalletBar";
import { NetworkGuard } from "@/components/NetworkGuard";
import { PoolList } from "@/components/PoolList";
import { PoolDetail } from "@/components/PoolDetail";
import { SwapForm } from "@/components/SwapForm";

export default function Home() {
  const [selected, setSelected] = useState<PoolCreatedEvent | null>(null);

  return (
    <main>
      <div className="trial-banner">
        ⚠️ Evaluation / trial software — BNB testnet only. Not production. Simulation-only by
        default; no real swaps are broadcast.
      </div>

      <h1>Forge Protocol — BNB Testnet Demo</h1>
      <p className="muted">
        Discover Forge pools, inspect their tokens and reserves, and simulate swaps against a
        configurable BNB testnet deployment.
      </p>

      <WalletBar />

      <NetworkGuard>
        <PoolList selected={selected?.pool ?? null} onSelect={setSelected} />

        {selected && (
          <div className="panel">
            <PoolDetail poolAddress={selected.pool} />
            <hr style={{ borderColor: "var(--border)", margin: "20px 0" }} />
            <SwapForm pool={selected} />
          </div>
        )}
      </NetworkGuard>
    </main>
  );
}
