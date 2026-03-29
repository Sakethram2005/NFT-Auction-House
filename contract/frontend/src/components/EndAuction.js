import React, { useState } from "react";
import { endAuction } from "./Soroban";

export default function EndAuction({ walletAddress }) {
  const [auctionId, setAuctionId] = useState("");
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleEnd = async () => {
    if (!walletAddress) {
      setStatus({ type: "error", msg: "Please connect your Freighter wallet first." });
      return;
    }
    if (!auctionId) {
      setStatus({ type: "error", msg: "Please enter an auction ID." });
      return;
    }
    setLoading(true);
    setStatus({ type: "loading", msg: "Ending auction on-chain..." });

    await endAuction(walletAddress, Number(auctionId))
      .then(() => {
        setStatus({ type: "success", msg: `Auction #${auctionId} has been finalized.` });
        setAuctionId("");
      })
      .catch((err) => {
        setStatus({ type: "error", msg: "Failed: " + err.message });
      });

    setLoading(false);
  };

  return (
    <div className="panel">
      <h2 className="panel-title">End Auction</h2>
      <p className="panel-subtitle">
        Finalize and close an active auction. Once ended,
        no further bids can be placed.
      </p>

      <div className="form-group">
        <label className="form-label">Auction ID</label>
        <input
          className="form-input"
          type="number"
          placeholder="Enter auction ID to end"
          value={auctionId}
          onChange={(e) => setAuctionId(e.target.value)}
        />
      </div>

      <button className="submit-btn danger" onClick={handleEnd} disabled={loading}>
        {loading ? "⏳ Ending..." : "⬛ End Auction"}
      </button>

      {status && (
        <p className={`status-msg ${status.type}`}>{status.msg}</p>
      )}
    </div>
  );
}