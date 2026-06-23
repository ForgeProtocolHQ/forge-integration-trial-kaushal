"use client";

import { useState } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { parseUnits } from "viem";
import {
  ForgeRouter,
  isRouterConfigured,
  validateSwapParams,
  type PoolCreatedEvent,
  type SwapSimulation,
} from "@forge-trial/sdk";
import { getDemoConfig } from "@/lib/config";
import { Banner, ErrorBanner } from "./ui";

const config = getDemoConfig();
const DEADLINE_HORIZON_SECONDS = 1_200n; // 20 minutes

export function SwapForm({ pool }: { pool: PoolCreatedEvent }) {
  const client = usePublicClient();
  const { address, isConnected } = useAccount();

  const [direction, setDirection] = useState<"0to1" | "1to0">("0to1");
  const [amount, setAmount] = useState("");
  const [decimals, setDecimals] = useState("18");
  const [slippageBps, setSlippageBps] = useState("50");
  const [sim, setSim] = useState<SwapSimulation | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [pending, setPending] = useState(false);

  const tokenIn = direction === "0to1" ? pool.token0 : pool.token1;
  const tokenOut = direction === "0to1" ? pool.token1 : pool.token0;

  async function onSimulate() {
    setError(null);
    setSim(null);
    setPending(true);
    try {
      if (!client) throw new Error("RPC client unavailable");
      if (!isConnected || !address) throw new Error("Connect a wallet first");

      // Build a deadline relative to the latest block (no Date.now reliance).
      const block = await client.getBlock();
      const params = validateSwapParams({
        tokenIn,
        tokenOut,
        amountIn: parseUnits(amount || "0", Number(decimals)),
        recipient: address,
        slippageBps: Number(slippageBps),
        deadline: block.timestamp + DEADLINE_HORIZON_SECONDS,
      });

      const router = new ForgeRouter(client, config);
      const result = await router.simulateSwap(params, address);
      setSim(result);
    } catch (e) {
      setError(e);
    } finally {
      setPending(false);
    }
  }

  if (!isRouterConfigured(config)) {
    return (
      <Banner kind="warn">
        Router address is not configured. Set{" "}
        <span className="mono">NEXT_PUBLIC_FORGE_ROUTER_ADDRESS</span> to enable swap simulation.
      </Banner>
    );
  }

  return (
    <div>
      <h3>Swap (simulation only)</h3>
      <p className="muted">
        This form never broadcasts a transaction. It runs{" "}
        <span className="mono">simulateContract</span> and reports the result.
      </p>

      <label>Direction</label>
      <select value={direction} onChange={(e) => setDirection(e.target.value as "0to1" | "1to0")}>
        <option value="0to1">token0 → token1</option>
        <option value="1to0">token1 → token0</option>
      </select>

      <label>Amount in</label>
      <input
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="0.0"
        inputMode="decimal"
      />

      <label>Token-in decimals</label>
      <input value={decimals} onChange={(e) => setDecimals(e.target.value)} inputMode="numeric" />

      <label>Slippage (basis points)</label>
      <input
        value={slippageBps}
        onChange={(e) => setSlippageBps(e.target.value)}
        inputMode="numeric"
      />

      <div className="row" style={{ marginTop: 16 }}>
        <button onClick={onSimulate} disabled={pending || !isConnected}>
          {pending ? "Simulating…" : "Simulate swap"}
        </button>
      </div>

      {error ? <ErrorBanner error={error} /> : null}

      {sim && (
        <Banner kind="ok">
          <div>Simulation succeeded.</div>
          <div className="mono">amountIn: {sim.amountIn.toString()}</div>
          {sim.quotedAmountOut !== undefined && (
            <div className="mono">quotedAmountOut: {sim.quotedAmountOut.toString()}</div>
          )}
          <div className="mono">amountOutMin: {sim.amountOutMin.toString()}</div>
        </Banner>
      )}
    </div>
  );
}
