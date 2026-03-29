import React, { useState } from "react";
import Header from "./components/Header";
import CreateAuction from "./components/CreateAuction";
import PlaceBid from "./components/PlaceBid";
import EndAuction from "./components/EndAuction";
import ViewAuction from "./components/ViewAuction";
import {
  checkConnection,
  retrievePublicKey,
  getBalance,
  getRequestAccess,
} from "./components/Freighter";
import "./App.css";

import * as StellarSdk from "@stellar/stellar-sdk";

const CONTRACT_ID = "CB6DGSQXSOJATMILCJQ377STZKGCU2RRTFR5E34XNQABHK44YTE2M75G";
const NETWORK_PASSPHRASE = StellarSdk.Networks.TESTNET;
const RPC_URL = "https://soroban-testnet.stellar.org";

export default function App() {
  const [walletAddress, setWalletAddress] = useState(null);
  const [balance, setBalance] = useState(null);
  const [connected, setConnected] = useState(false);
  const [activeTab, setActiveTab] = useState("create");

  const connectWallet = async () => {
    try {
      // Step 1: setAllowed() — opens Freighter permission popup
      await checkConnection();

      // Step 2: requestAccess() — grants dApp access
      await getRequestAccess();

      // Step 3: getAddress() — fetch public key
      const address = await retrievePublicKey();
      if (!address) {
        alert("Could not get wallet address. Please try again.");
        return;
      }

      // Step 4: fetch XLM balance
      const bal = await getBalance();

      setWalletAddress(address);
      setBalance(parseFloat(bal).toFixed(2));
      setConnected(true);
    } catch (err) {
      console.error("Wallet connection failed:", err);
      alert("Connection failed: " + err.message);
    }
  };

  return (
    <div className="app">
      <Header
        walletAddress={walletAddress}
        balance={balance}
        connected={connected}
        onConnect={connectWallet}
      />

      <main className="main-content">
        <div className="hero">
          <div className="hero-badge">✦ Stellar Soroban Network</div>
          <h1 className="hero-title">
            NFT Auction
            <br />
            <span className="hero-accent">House</span>
          </h1>
          <p className="hero-sub">
            Decentralized auctions. Trustless bids. On-chain transparency.
          </p>
        </div>

        <nav className="tabs">
          {["create", "bid", "end", "view"].map((tab) => (
            <button
              key={tab}
              className={`tab-btn ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === "create" && "✦ Create Auction"}
              {tab === "bid"    && "⬆ Place Bid"}
              {tab === "end"    && "⬛ End Auction"}
              {tab === "view"   && "◎ View Auction"}
            </button>
          ))}
        </nav>

        <div className="panel-container">
          {activeTab === "create" && (
            <CreateAuction
              contractId={CONTRACT_ID}
              networkPassphrase={NETWORK_PASSPHRASE}
              rpcUrl={RPC_URL}
              walletAddress={walletAddress}
            />
          )}
          {activeTab === "bid" && (
            <PlaceBid
              contractId={CONTRACT_ID}
              networkPassphrase={NETWORK_PASSPHRASE}
              rpcUrl={RPC_URL}
              walletAddress={walletAddress}
            />
          )}
          {activeTab === "end" && (
            <EndAuction
              contractId={CONTRACT_ID}
              networkPassphrase={NETWORK_PASSPHRASE}
              rpcUrl={RPC_URL}
              walletAddress={walletAddress}
            />
          )}
          {activeTab === "view" && (
            <ViewAuction
              contractId={CONTRACT_ID}
              networkPassphrase={NETWORK_PASSPHRASE}
              rpcUrl={RPC_URL}
              walletAddress={walletAddress}
            />
          )}
        </div>
      </main>

      <footer className="footer">
        <span>NFT Auction House · Stellar Soroban</span>
        <span className="footer-contract">Contract: CB6DGSQX...M75G</span>
      </footer>
    </div>
  );
}