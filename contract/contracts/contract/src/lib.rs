#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Env, Symbol, String, symbol_short};

// Storage Keys
const AUCTION_COUNT: Symbol = symbol_short!("AUC_CNT");

// Auction Struct
#[contracttype]
#[derive(Clone)]
pub struct Auction {
    pub id: u64,
    pub title: String,
    pub description: String,
    pub highest_bid: u64,
    pub highest_bidder: u64,
    pub is_active: bool,
}

// Mapping Auction ID → Auction
#[contracttype]
pub enum AuctionBook {
    Auction(u64),
}

#[contract]
pub struct NFTAuctionHouse;

#[contractimpl]
impl NFTAuctionHouse {

    // 1. Create Auction
    pub fn create_auction(env: Env, title: String, description: String) -> u64 {
        let mut count: u64 = env.storage().instance().get(&AUCTION_COUNT).unwrap_or(0);
        count += 1;

        let auction = Auction {
            id: count,
            title,
            description,
            highest_bid: 0,
            highest_bidder: 0,
            is_active: true,
        };

        env.storage().instance().set(&AuctionBook::Auction(count), &auction);
        env.storage().instance().set(&AUCTION_COUNT, &count);

        count
    }

    // 2. Place Bid
    pub fn place_bid(env: Env, auction_id: u64, bidder: u64, amount: u64) {
        let key = AuctionBook::Auction(auction_id);
        let mut auction: Auction = env.storage().instance().get(&key).unwrap();

        if !auction.is_active {
            panic!("Auction is not active");
        }

        if amount <= auction.highest_bid {
            panic!("Bid must be higher than current highest bid");
        }

        auction.highest_bid = amount;
        auction.highest_bidder = bidder;

        env.storage().instance().set(&key, &auction);
    }

    // 3. End Auction
    pub fn end_auction(env: Env, auction_id: u64) {
        let key = AuctionBook::Auction(auction_id);
        let mut auction: Auction = env.storage().instance().get(&key).unwrap();

        if !auction.is_active {
            panic!("Auction already ended");
        }

        auction.is_active = false;

        env.storage().instance().set(&key, &auction);
    }

    // 4. View Auction
    pub fn view_auction(env: Env, auction_id: u64) -> Auction {
        env.storage()
            .instance()
            .get(&AuctionBook::Auction(auction_id))
            .unwrap()
    }
}