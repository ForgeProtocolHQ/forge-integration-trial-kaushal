"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { shortenAddress } from "@forge-trial/sdk";

export function WalletBar() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();
  const injected = connectors[0];

  return (
    <div className="panel">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div>
          <h2 style={{ marginBottom: 4 }}>Wallet</h2>
          <span className="muted">
            {isConnected && address ? (
              <span className="mono">{shortenAddress(address)}</span>
            ) : (
              "Not connected"
            )}
          </span>
        </div>
        <div className="row">
          {isConnected ? (
            <button className="secondary" onClick={() => disconnect()}>
              Disconnect
            </button>
          ) : (
            <button
              disabled={!injected || isPending}
              onClick={() => injected && connect({ connector: injected })}
            >
              {isPending ? "Connecting…" : "Connect Wallet"}
            </button>
          )}
        </div>
      </div>
      {!injected && (
        <p className="muted" style={{ marginTop: 8 }}>
          No injected wallet detected. Install MetaMask or a compatible browser wallet.
        </p>
      )}
      {error && (
        <p className="muted" style={{ marginTop: 8 }}>
          Connection rejected or failed: {error.message}
        </p>
      )}
    </div>
  );
}
