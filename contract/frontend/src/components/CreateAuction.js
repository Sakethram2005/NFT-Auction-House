import React, { useState } from "react";
import { createAuction } from "./Soroban";

export default function CreateAuction({ walletAddress }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startingBid, setStartingBid] = useState("");
  const [endTime, setEndTime] = useState("");
  const [auctionId, setAuctionId] = useState();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!walletAddress) {
      setStatus({ type: "error", msg: "Please connect your Freighter wallet first." });
      return;
    }
    if (!title.trim() || !description.trim() || !startingBid || !endTime) {
      setStatus({ type: "error", msg: "All fields are required." });
      return;
    }

    setLoading(true);
    setStatus({ type: "loading", msg: "Creating auction on-chain..." });
    setAuctionId(undefined);

    try {
      const id = await createAuction(
        walletAddress,
        title.trim(),
        description.trim(),
        Number(startingBid),
        Number(endTime)
      );
      setAuctionId(id);
      setStatus({ type: "success", msg: "Auction created successfully!" });
      setTitle("");
      setDescription("");
      setStartingBid("");
      setEndTime("");
    } catch (err) {
      console.error("handleCreate error:", err);
      setStatus({ type: "error", msg: "Failed: " + err.message });
    }

    setLoading(false);
  };

  return (
    <div className="panel">
      <h2 className="panel-title">Create Auction</h2>
      <p className="panel-subtitle">
        List your NFT for auction on the Stellar blockchain.
        Each auction gets a unique on-chain ID.
      </p>

      <div className="form-group">
        <label className="form-label">Auction Title</label>
        <input
          className="form-input"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Description</label>
        <textarea
          className="form-input"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Starting Bid (XLM)</label>
        <input
          className="form-input"
          type="number"
          value={startingBid}
          onChange={(e) => setStartingBid(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label className="form-label">End Time (Unix timestamp)</label>
        <input
          className="form-input"
          type="number"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
        />
      </div>

      <button className="submit-btn" onClick={handleCreate} disabled={loading}>
        {loading ? "⏳ Creating..." : "✦ Create Auction"}
      </button>

      {status && <p className={`status-msg ${status.type}`}>{status.msg}</p>}

      {auctionId !== undefined && (
        <div className="result-card">
          <div className="result-label">Auction Created · ID</div>
          <div className="result-value">{auctionId}</div>
        </div>
      )}
    </div>
  );
}