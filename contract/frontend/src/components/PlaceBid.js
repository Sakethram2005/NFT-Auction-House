import React, { useState } from "react";
import { placeBid } from "./Soroban";

export default function PlaceBid({ walletAddress }) {
  const [auctionId, setAuctionId] = useState("");
  const [bidder, setBidder] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleBid = async () => {
    if (!walletAddress) {
      setStatus({ type: "error", msg: "Please connect your Freighter wallet first." });
      return;
    }
    if (!auctionId || !bidder || !amount) {
      setStatus({ type: "error", msg: "All fields are required." });
      return;
    }
    setLoading(true);
    setStatus({ type: "loading", msg: "Submitting bid on-chain..." });

    await placeBid(walletAddress, Number(auctionId), Number(bidder), Number(amount))
      .then(() => {
        setStatus({ type: "success", msg: `Bid of ${amount} XLM placed on Auction #${auctionId}!` });
        setBidder("");
        setAmount("");
      })
      .catch((err) => {
        setStatus({ type: "error", msg: "Failed: " + err.message });
      });

    setLoading(false);
  };

  return (
    <div className="panel">
      <h2 className="panel-title">Place a Bid</h2>
      <p className="panel-subtitle">
        Submit a bid on any active auction. Your bid must exceed
        the current highest bid to be accepted.
      </p>

      <div className="form-group">
        <label className="form-label">Auction ID</label>
        <input
          className="form-input"
          type="number"
          placeholder="Enter auction ID"
          value={auctionId}
          onChange={(e) => setAuctionId(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Bidder ID</label>
        <input
          className="form-input"
          type="number"
          placeholder="Your bidder ID"
          value={bidder}
          onChange={(e) => setBidder(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Bid Amount (XLM)</label>
        <input
          className="form-input"
          type="number"
          placeholder="e.g. 150"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>

      <button className="submit-btn secondary" onClick={handleBid} disabled={loading}>
        {loading ? "⏳ Bidding..." : "⬆ Place Bid"}
      </button>

      {status && (
        <p className={`status-msg ${status.type}`}>{status.msg}</p>
      )}
    </div>
  );
}