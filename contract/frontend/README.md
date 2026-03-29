# NFT Auction House dApp

A full-stack decentralized application (dApp) built on the Stellar blockchain. This platform allows users to create NFT auctions, place bids, and finalize auctions in a transparent and decentralized environment. Each auction is uniquely identified and stored on-chain, ensuring trustless participation.

---

## Table of Contents
- Technologies Used
- Smart-contract Info
- ⚠️ Issue
- Project Setup Guide

---

## Technologies Used

Smartcontract : Rust, Soroban-SDK  
Wallet : Freighter (Chrome Extension)  
Frontend : ReactJS, TailwindCSS  
Integration : Stellar-SDK  

---

## Smart-contract Info

All the materials related to the smart contract can be found in the NFT-Auction-House folder:

Path to smart contract:  
`./NFT-Auction-House/contract/src/lib.rs`

Deployed smartcontract address:  
`<YOUR_CONTRACT_ADDRESS_HERE>`

---

### Functions written inside the NFT Auction Smartcontract:

---

**create_auction(env: Env, title: String, description: String) -> u64**

- Creates a new NFT auction
- Assigns a unique auction ID
- Stores auction details on-chain
- Returns the auction ID

---

**place_bid(env: Env, auction_id: u64, bidder: u64, amount: u64)**

- Allows users to place bids on an active auction
- Updates highest bid and bidder
- Rejects bids lower than current highest bid

---

**end_auction(env: Env, auction_id: u64)**

- Ends an active auction
- Marks auction as inactive
- Prevents further bids

---

**view_auction(env: Env, auction_id: u64) -> Auction**

- Fetches auction details using auction ID
- Returns full auction data (title, description, highest bid, bidder, status)

---

## ⚠️ Issue

### Title:
Getting Undefined While Fetching Auction Data Using Stellar-SDK

---

### Note:
All smart contract functions work correctly when invoked via Stellar CLI.

---

### Issue Description:

When calling the **view_auction()** function from the frontend using Stellar-SDK, the response returns `undefined` instead of the expected auction object.

Similarly:
- **create_auction()** successfully creates auctions on-chain but returns `undefined` instead of auction ID
- **place_bid()** updates state correctly but does not return expected confirmation

---

### Possible Causes:

- Improper decoding of SCVal response in frontend
- Missing simulation + result parsing step
- Not extracting return values from `resultMetaXdr`

---

### Files Involved:

Transaction builder and contract interaction logic:  
`src/components/Soroban.js`

---

### Reference Documentation Used:

https://developers.stellar.org/docs/build/guides/transactions/invoke-contract-tx-sdk

---

## Project Setup Guide

---

### Prerequisites

- Install NodeJS
- Install Rust
- Install Stellar CLI
- Install Freighter Wallet (Chrome Extension)

---

### Steps to Run

1. Clone the repository:

```bash
git clone <https://github.com/Sakethram2005/NFT-Auction-House>