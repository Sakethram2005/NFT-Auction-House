import React, { useState } from "react";
import { viewAuction } from "./Soroban";

export default function ViewAuction({ walletAddress }) {
  const [auctionId, setAuctionId] = useState("");
  const [auction, setAuction] = useState(null);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFetch = async () => {
    if (!auctionId) {
      setStatus({ type: "error", msg: "Please enter an auction ID." });
      return;
    }
    setLoading(true);
    setStatus({ type: "loading", msg: "Fetching auction data..." });
    setAuction(null);

    await viewAuction(walletAddress, Number(auctionId))
      .then((data) => {
        setAuction(data);
        setStatus(null);
      })
      .catch((err) => {
        setStatus({ type: "error", msg: "Failed: " + err.message });
      });

    setLoading(false);
  };

  return (
    <div className="panel">
      <h2 className="panel-title">View Auction</h2>
      <p className="panel-subtitle">
        Look up any auction by its ID to see current bids,
        status, and details.
      </p>

      <div className="form-group">
        <label className="form-label">Auction ID</label>
        <input
          className="form-input"
          type="number"
          placeholder="Enter auction ID"
          value={auctionId}
          onChange={(e) => setAuctionId(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleFetch()}
        />
      </div>

      <button className="submit-btn" onClick={handleFetch} disabled={loading}>
        {loading ? "⏳ Fetching..." : "◎ View Auction"}
      </button>

      {status && (
        <p className={`status-msg ${status.type}`}>{status.msg}</p>
      )}

      {auction && (
        <div className="auction-card">
          <div className="auction-header">
            <span className="auction-id-tag">
              Auction #{String(auction.id)}
            </span>
            <span className={`status-badge ${auction.is_active ? "active" : "ended"}`}>
              {auction.is_active ? "● Active" : "■ Ended"}
            </span>
          </div>

          <h3 className="auction-title">{String(auction.title)}</h3>
          <p className="auction-desc">{String(auction.description)}</p>

          <div className="divider" />

          <div className="auction-stats">
            <div className="stat-box">
              <div className="stat-label">Highest Bid</div>
              <div className="stat-value">
                {String(auction.highest_bid || 0)}
                <span style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginLeft: "4px" }}>
                  XLM
                </span>
              </div>
            </div>
            <div className="stat-box">
              <div className="stat-label">Top Bidder ID</div>
              <div className="stat-value">
                {String(auction.highest_bidder) === "0"
                  ? <span style={{ fontSize: "1rem", color: "var(--text-muted)" }}>None yet</span>
                  : `#${String(auction.highest_bidder)}`
                }
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}