"use client";

import type { ReactNode } from "react";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { BNB_TESTNET_ID, isExpectedChain } from "@forge-trial/sdk";
import { getDemoConfig } from "@/lib/config";
import { Banner } from "./ui";

const config = getDemoConfig();

/**
 * Renders a wrong-network warning + switch action when the connected chain does
 * not match the configured chain. Children render only on the correct network.
 */
export function NetworkGuard({ children }: { children: ReactNode }) {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending } = useSwitchChain();

  if (!isConnected) return <>{children}</>;

  if (!isExpectedChain(config, chainId)) {
    return (
      <Banner kind="warn">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <span>
            Wrong network — this app requires <strong>BNB testnet (chain {config.chainId})</strong>.
            You are on chain {chainId}.
          </span>
          <button onClick={() => switchChain({ chainId: BNB_TESTNET_ID })} disabled={isPending}>
            {isPending ? "Switching…" : "Switch network"}
          </button>
        </div>
      </Banner>
    );
  }

  return <>{children}</>;
}
