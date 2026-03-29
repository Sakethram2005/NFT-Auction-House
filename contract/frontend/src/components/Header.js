import React from "react";

export default function Header({ walletAddress, balance, connected, onConnect }) {
  const shortAddress = walletAddress
    ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`
    : null;

  return (
    <header className="header">
      <div className="header-logo">
        NFT <span>Auction</span> House
      </div>
      <div className="header-right">
        {connected && shortAddress && (
          <>
            <span className="wallet-address">{shortAddress}</span>
            {balance && (
              <span className="wallet-balance">⬡ {balance} XLM</span>
            )}
          </>
        )}
        <button
          className={`connect-btn ${connected ? "connected" : ""}`}
          onClick={onConnect}
        >
          {connected ? "✓ Connected" : "Connect Wallet"}
        </button>
      </div>
    </header>
  );
}