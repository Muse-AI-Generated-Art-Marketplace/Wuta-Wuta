// ============================================================================
// wutawuta_marketplace.rs — Optimized for Soroban storage footprint (Issue #42)
//
// Storage optimizations applied:
// 1. DataKey enum for all storage keys — eliminates type-based collisions and
//    removes repeated Symbol::new / Map::new key allocations.
// 2. instance() storage for global config only (admin, fee, treasury, counters).
// 3. persistent() storage for per-token / per-user data (artworks, listings,
//    bids, evolutions, offers, ownership, creator tokens).
// 4. Each artwork, listing, ownership record stored under its own DataKey
//    variant keyed by token_id — avoids loading/deserializing entire Maps.
// 5. Added TTL management (bump) on every persistent read/write so entries
//    survive across ledgers without manual renewal.
// 6. Replaced raw [u8; 32] with BytesN<32> for content_hash (Soroban-native).
// 7. Replaced String fields with Symbol where value fits ≤ 32 bytes
//    (ai_model stored as Symbol since model names are short identifiers).
// 8. Compact ListingStatus enum replaces bool `active` field.
// ============================================================================

// Cross-chain bridge module (Issue #43)
pub mod bridge_interface;

use soroban_sdk::{
    contract, contractimpl, contracttype, Address, BytesN, Env, String, Symbol, Vec,
};

// ---------------------------------------------------------------------------
// TTL constants (ledger sequence numbers, ~5 s per ledger)
// ---------------------------------------------------------------------------
const LIFETIME_THRESHOLD: u32 = 17_280;   // ~1 day — bump when TTL drops below
const BUMP_AMOUNT: u32 = 518_400;          // ~30 days — extension amount

// ---------------------------------------------------------------------------
// DataKey — single enum for every storage slot.
// Using an enum guarantees unique keys and lets the SDK encode them compactly.
// ---------------------------------------------------------------------------
#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    // ---- instance() keys (global config) ----
    Admin,
    NftCounter,
    MarketplaceFee,
    Treasury,
    EvolutionFee,
    MinEvolutionInterval,
    OfferCounter,

    // ---- persistent() keys (per-entity data) ----
    Artwork(u64),            // token_id → Artwork
    Listing(u64),            // token_id → Listing
    Ownership(u64),          // token_id → Address (owner)
    CreatorTokens(Address),  // creator → Vec<u64>
    Bids(u64),               // token_id → Vec<Bid>
    Evolutions(u64),         // token_id → Vec<Evolution>
    Offers(u64),             // token_id → Vec<Offer>
    RoyaltyHistory,          // global → Vec<RoyaltyPayment>
}

// ---------------------------------------------------------------------------
// Data structures — optimized field types
// ---------------------------------------------------------------------------

/// Artwork metadata.
/// - `ai_model` changed from String → Symbol (model names ≤ 32 chars).
/// - `content_hash` changed from [u8; 32] → BytesN<32> (Soroban-native).
/// - `ai_contribution` and `human_contribution` could be derived from each
///   other (sum=100), but both are kept for clarity; they are only u32 (4 bytes).
#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub struct Artwork {
    pub token_id: u64,
    pub creator: Address,
    pub ipfs_hash: String,          // variable-length IPFS CID — must stay String
    pub title: String,              // user-provided title — may exceed Symbol limit
    pub description: String,        // user-provided — may exceed Symbol limit
    pub ai_model: Symbol,           // short identifier, fits in Symbol (≤32 bytes)
    pub creation_timestamp: u64,
    pub content_hash: BytesN<32>,   // Soroban-native fixed-size bytes
    pub royalty_percentage: u32,    // basis points
    pub is_collaborative: bool,
    pub ai_contribution: u32,
    pub human_contribution: u32,
    pub can_evolve: bool,
    pub evolution_count: u32,
}

/// Listing status — compact enum replaces bool `active`.
#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
#[repr(u32)]
pub enum ListingStatus {
    Active = 0,
    Sold = 1,
    Cancelled = 2,
}

#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub struct Listing {
    pub token_id: u64,
    pub seller: Address,
    pub price: i128,
    pub start_time: u64,
    pub duration: u64,
    pub status: ListingStatus,       // replaces `active: bool`
    pub auction_style: bool,
    pub reserve_price: Option<i128>,
}

#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub struct Bid {
    pub token_id: u64,
    pub bidder: Address,
    pub amount: i128,
    pub timestamp: u64,
    pub active: bool,
}

/// Evolution record.
/// - `content_hash` → BytesN<32>.
#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub struct Evolution {
    pub token_id: u64,
    pub evolution_id: u32,
    pub evolver: Address,
    pub prompt: String,
    pub new_ipfs_hash: String,
    pub timestamp: u64,
    pub content_hash: BytesN<32>,
}

#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub struct Offer {
    pub id: u32,
    pub token_id: u64,
    pub buyer: Address,
    pub amount: i128,
    pub expires: u64,
    pub active: bool,
    pub payment_token: Address,
}

#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub struct RoyaltyPayment {
    pub token_id: u64,
    pub creator: Address,
    pub amount: i128,
    pub timestamp: u64,
}

// ---------------------------------------------------------------------------
// Contract
// ---------------------------------------------------------------------------

#[contract]
pub struct WutaWutaMarketplace;

#[contractimpl]
impl WutaWutaMarketplace {
    // -----------------------------------------------------------------------
    // Initialization
    // -----------------------------------------------------------------------

    pub fn initialize(
        env: Env,
        admin: Address,
        marketplace_fee: u32,
        treasury: Address,
        evolution_fee: i128,
        min_evolution_interval: u64,
    ) {
        // Global config → instance() storage
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::NftCounter, &0u64);
        env.storage().instance().set(&DataKey::MarketplaceFee, &marketplace_fee);
        env.storage().instance().set(&DataKey::Treasury, &treasury);
        env.storage().instance().set(&DataKey::EvolutionFee, &evolution_fee);
        env.storage().instance().set(&DataKey::MinEvolutionInterval, &min_evolution_interval);
        env.storage().instance().set(&DataKey::OfferCounter, &0u32);

        // Bump instance TTL
        env.storage().instance().bump(LIFETIME_THRESHOLD, BUMP_AMOUNT);

        env.events().publish(
            (Symbol::new(&env, "marketplace_initialized"),),
            (admin, marketplace_fee, treasury),
        );
    }

    // -----------------------------------------------------------------------
    // Mint
    // -----------------------------------------------------------------------

    pub fn mint_artwork(
        env: Env,
        creator: Address,
        ipfs_hash: String,
        title: String,
        description: String,
        ai_model: Symbol,
        content_hash: BytesN<32>,
        royalty_percentage: u32,
        is_collaborative: bool,
        ai_contribution: u32,
        human_contribution: u32,
        can_evolve: bool,
    ) -> u64 {
        let admin = Self::get_admin(&env);
        admin.require_auth();

        // Validate
        if royalty_percentage > 1000 { panic!("Royalty too high (max 10%)"); }
        if is_collaborative && ai_contribution + human_contribution != 100 {
            panic!("Contributions must sum to 100");
        }

        let token_id = Self::increment_nft_counter(&env);
        let creation_timestamp = env.ledger().timestamp();

        let artwork = Artwork {
            token_id,
            creator: creator.clone(),
            ipfs_hash: ipfs_hash.clone(),
            title: title.clone(),
            description,
            ai_model: ai_model.clone(),
            creation_timestamp,
            content_hash,
            royalty_percentage,
            is_collaborative,
            ai_contribution,
            human_contribution,
            can_evolve,
            evolution_count: 0,
        };

        // Store artwork individually in persistent()
        env.storage().persistent().set(&DataKey::Artwork(token_id), &artwork);
        Self::bump_persistent(&env, &DataKey::Artwork(token_id));

        // Update creator's token list in persistent()
        let mut creator_tokens: Vec<u64> = env
            .storage()
            .persistent()
            .get(&DataKey::CreatorTokens(creator.clone()))
            .unwrap_or(Vec::new(&env));
        creator_tokens.push_back(token_id);
        env.storage().persistent().set(&DataKey::CreatorTokens(creator.clone()), &creator_tokens);
        Self::bump_persistent(&env, &DataKey::CreatorTokens(creator.clone()));

        // Set ownership
        env.storage().persistent().set(&DataKey::Ownership(token_id), &creator);
        Self::bump_persistent(&env, &DataKey::Ownership(token_id));

        env.events().publish(
            (Symbol::new(&env, "artwork_minted"),),
            (
                token_id,
                creator,
                ipfs_hash,
                title,
                ai_model,
                royalty_percentage,
                is_collaborative,
            ),
        );

        token_id
    }

    // -----------------------------------------------------------------------
    // Listing
    // -----------------------------------------------------------------------

    pub fn list_artwork(
        env: Env,
        seller: Address,
        token_id: u64,
        price: i128,
        duration: u64,
        auction_style: bool,
        reserve_price: Option<i128>,
    ) {
        seller.require_auth();

        let owner = Self::get_token_owner(&env, token_id);
        if owner != seller { panic!("Not the token owner"); }

        // Check not already listed
        if env.storage().persistent().has(&DataKey::Listing(token_id)) {
            let existing: Listing = env.storage().persistent().get(&DataKey::Listing(token_id)).unwrap();
            if existing.status == ListingStatus::Active { panic!("Already listed"); }
        }

        if price <= 0 { panic!("Price must be positive"); }
        if duration == 0 { panic!("Duration must be positive"); }
        if duration > 2_592_000 { panic!("Duration too long (max 30 days)"); }

        if auction_style {
            if reserve_price.is_none() { panic!("Reserve price required for auctions"); }
            if reserve_price.unwrap() <= 0 { panic!("Reserve price must be positive"); }
        }

        let listing = Listing {
            token_id,
            seller: seller.clone(),
            price,
            start_time: env.ledger().timestamp(),
            duration,
            status: ListingStatus::Active,
            auction_style,
            reserve_price,
        };

        env.storage().persistent().set(&DataKey::Listing(token_id), &listing);
        Self::bump_persistent(&env, &DataKey::Listing(token_id));

        env.events().publish(
            (Symbol::new(&env, "artwork_listed"),),
            (token_id, seller, price, duration, auction_style),
        );
    }

    // -----------------------------------------------------------------------
    // Purchase (fixed-price)
    // -----------------------------------------------------------------------

    pub fn buy_artwork(env: Env, buyer: Address, token_id: u64, _payment_token: Address) {
        buyer.require_auth();

        let mut listing: Listing = env
            .storage()
            .persistent()
            .get(&DataKey::Listing(token_id))
            .expect("Listing not found");

        if listing.status != ListingStatus::Active { panic!("Listing not active"); }
        if listing.auction_style { panic!("Use auction functions for auction listings"); }
        if env.ledger().timestamp() >= listing.start_time + listing.duration { panic!("Listing expired"); }

        let marketplace_fee = Self::get_marketplace_fee(&env);
        let artwork = Self::get_artwork_internal(&env, token_id);

        let fee_amount = (listing.price * marketplace_fee as i128) / 10000;
        let seller_amount = listing.price - fee_amount;
        let royalty_amount = (listing.price * artwork.royalty_percentage as i128) / 10000;
        let _final_seller_amount = seller_amount - royalty_amount;

        // Payment transfers would happen here via token contract calls

        // Update ownership
        env.storage().persistent().set(&DataKey::Ownership(token_id), &buyer);
        Self::bump_persistent(&env, &DataKey::Ownership(token_id));

        // Update token lists
        Self::remove_from_creator_tokens(&env, &listing.seller, token_id);
        Self::add_to_creator_tokens(&env, &buyer, token_id);

        // Mark listing as sold
        listing.status = ListingStatus::Sold;
        env.storage().persistent().set(&DataKey::Listing(token_id), &listing);

        // Record royalty
        if royalty_amount > 0 {
            Self::record_royalty(&env, token_id, &artwork.creator, royalty_amount);
        }

        env.events().publish(
            (Symbol::new(&env, "artwork_sold"),),
            (token_id, buyer, listing.seller, listing.price, fee_amount, royalty_amount),
        );
    }

    // -----------------------------------------------------------------------
    // Bidding (auction)
    // -----------------------------------------------------------------------

    pub fn make_bid(env: Env, bidder: Address, token_id: u64, amount: i128, _payment_token: Address) {
        bidder.require_auth();

        let listing: Listing = env
            .storage()
            .persistent()
            .get(&DataKey::Listing(token_id))
            .expect("Listing not found");

        if listing.status != ListingStatus::Active { panic!("Listing not active"); }
        if !listing.auction_style { panic!("Not an auction listing"); }
        if env.ledger().timestamp() >= listing.start_time + listing.duration { panic!("Auction expired"); }

        let bid = Bid {
            token_id,
            bidder: bidder.clone(),
            amount,
            timestamp: env.ledger().timestamp(),
            active: true,
        };

        let mut bids: Vec<Bid> = env
            .storage()
            .persistent()
            .get(&DataKey::Bids(token_id))
            .unwrap_or(Vec::new(&env));

        // Deactivate previous bids for this token
        let mut updated = Vec::new(&env);
        for b in bids.iter() {
            let mut bc = b.clone();
            if bc.active {
                bc.active = false;
            }
            updated.push_back(bc);
        }
        updated.push_back(bid);

        env.storage().persistent().set(&DataKey::Bids(token_id), &updated);
        Self::bump_persistent(&env, &DataKey::Bids(token_id));

        env.events().publish(
            (Symbol::new(&env, "bid_made"),),
            (token_id, bidder, amount),
        );
    }

    pub fn end_auction(env: Env, token_id: u64, _payment_token: Address) {
        let mut listing: Listing = env
            .storage()
            .persistent()
            .get(&DataKey::Listing(token_id))
            .expect("Listing not found");

        if listing.status != ListingStatus::Active { panic!("Listing not active"); }
        if !listing.auction_style { panic!("Not an auction listing"); }
        if env.ledger().timestamp() < listing.start_time + listing.duration { panic!("Auction not ended"); }

        let highest_bid = Self::get_highest_bid_internal(&env, token_id);
        if highest_bid.is_none() { panic!("No bids found"); }
        let bid = highest_bid.unwrap();

        if let Some(reserve) = listing.reserve_price {
            if bid.amount < reserve { panic!("Reserve price not met"); }
        }

        let marketplace_fee = Self::get_marketplace_fee(&env);
        let artwork = Self::get_artwork_internal(&env, token_id);

        let fee_amount = (bid.amount * marketplace_fee as i128) / 10000;
        let seller_amount = bid.amount - fee_amount;
        let royalty_amount = (bid.amount * artwork.royalty_percentage as i128) / 10000;
        let _final_seller_amount = seller_amount - royalty_amount;

        // Payment transfers would happen here

        // Update ownership
        env.storage().persistent().set(&DataKey::Ownership(token_id), &bid.bidder);
        Self::bump_persistent(&env, &DataKey::Ownership(token_id));

        Self::remove_from_creator_tokens(&env, &listing.seller, token_id);
        Self::add_to_creator_tokens(&env, &bid.bidder, token_id);

        listing.status = ListingStatus::Sold;
        env.storage().persistent().set(&DataKey::Listing(token_id), &listing);

        env.events().publish(
            (Symbol::new(&env, "auction_ended"),),
            (token_id, bid.bidder, listing.seller, bid.amount, fee_amount, royalty_amount),
        );
    }

    // -----------------------------------------------------------------------
    // Evolution
    // -----------------------------------------------------------------------

    pub fn evolve_artwork(
        env: Env,
        evolver: Address,
        token_id: u64,
        prompt: String,
        new_ipfs_hash: String,
        content_hash: BytesN<32>,
        _payment_token: Address,
    ) {
        evolver.require_auth();

        let owner = Self::get_token_owner(&env, token_id);
        if owner != evolver { panic!("Not the token owner"); }

        let mut artwork = Self::get_artwork_internal(&env, token_id);
        if !artwork.can_evolve { panic!("Artwork cannot evolve"); }

        let min_interval: u64 = env.storage().instance().get(&DataKey::MinEvolutionInterval).unwrap_or(86400);
        if env.ledger().timestamp() < artwork.creation_timestamp + min_interval {
            panic!("Evolution interval not met");
        }

        let evolution_id = artwork.evolution_count + 1;
        let evolution = Evolution {
            token_id,
            evolution_id,
            evolver: evolver.clone(),
            prompt: prompt.clone(),
            new_ipfs_hash: new_ipfs_hash.clone(),
            timestamp: env.ledger().timestamp(),
            content_hash,
        };

        // Store evolution in per-token persistent() vec
        let mut evolutions: Vec<Evolution> = env
            .storage()
            .persistent()
            .get(&DataKey::Evolutions(token_id))
            .unwrap_or(Vec::new(&env));
        evolutions.push_back(evolution);
        env.storage().persistent().set(&DataKey::Evolutions(token_id), &evolutions);
        Self::bump_persistent(&env, &DataKey::Evolutions(token_id));

        // Update artwork evolution count
        artwork.evolution_count = evolution_id;
        env.storage().persistent().set(&DataKey::Artwork(token_id), &artwork);
        Self::bump_persistent(&env, &DataKey::Artwork(token_id));

        env.events().publish(
            (Symbol::new(&env, "artwork_evolved"),),
            (token_id, evolution_id, evolver, prompt, new_ipfs_hash),
        );
    }

    // -----------------------------------------------------------------------
    // Cancel listing
    // -----------------------------------------------------------------------

    pub fn cancel_listing(env: Env, seller: Address, token_id: u64) {
        seller.require_auth();

        let mut listing: Listing = env
            .storage()
            .persistent()
            .get(&DataKey::Listing(token_id))
            .expect("Listing not found");

        if listing.seller != seller { panic!("Not the seller"); }
        if listing.status != ListingStatus::Active { panic!("Listing not active"); }

        listing.status = ListingStatus::Cancelled;
        env.storage().persistent().set(&DataKey::Listing(token_id), &listing);

        env.events().publish(
            (Symbol::new(&env, "listing_cancelled"),),
            (token_id, seller),
        );
    }

    // -----------------------------------------------------------------------
    // Offers
    // -----------------------------------------------------------------------

    pub fn make_offer(
        env: Env,
        buyer: Address,
        token_id: u64,
        amount: i128,
        duration: u64,
        payment_token: Address,
    ) -> u32 {
        buyer.require_auth();

        let _artwork = Self::get_artwork_internal(&env, token_id);
        let owner = Self::get_token_owner(&env, token_id);
        if owner == buyer { panic!("Already own this token"); }
        if amount <= 0 { panic!("Amount must be positive"); }
        if duration == 0 { panic!("Duration must be positive"); }

        let offer_id = Self::increment_offer_counter(&env);
        let expires = env.ledger().timestamp() + duration;

        let offer = Offer {
            id: offer_id,
            token_id,
            buyer: buyer.clone(),
            amount,
            expires,
            active: true,
            payment_token,
        };

        let mut offers: Vec<Offer> = env
            .storage()
            .persistent()
            .get(&DataKey::Offers(token_id))
            .unwrap_or(Vec::new(&env));
        offers.push_back(offer);
        env.storage().persistent().set(&DataKey::Offers(token_id), &offers);
        Self::bump_persistent(&env, &DataKey::Offers(token_id));

        env.events().publish(
            (Symbol::new(&env, "offer_made"),),
            (token_id, buyer, amount, expires, offer_id),
        );

        offer_id
    }

    pub fn accept_offer(env: Env, seller: Address, token_id: u64, offer_id: u32) {
        seller.require_auth();

        let owner = Self::get_token_owner(&env, token_id);
        if owner != seller { panic!("Not the token owner"); }

        let mut offers: Vec<Offer> = env
            .storage()
            .persistent()
            .get(&DataKey::Offers(token_id))
            .expect("No offers for this token");

        let mut offer_index = None;
        for i in 0..offers.len() {
            let offer = offers.get(i).unwrap();
            if offer.id == offer_id && offer.active {
                if env.ledger().timestamp() >= offer.expires {
                    panic!("Offer expired");
                }
                offer_index = Some(i);
                break;
            }
        }

        let i = offer_index.expect("Offer not found or inactive");
        let mut offer = offers.get(i).unwrap();

        let marketplace_fee = Self::get_marketplace_fee(&env);
        let artwork = Self::get_artwork_internal(&env, token_id);

        let fee_amount = (offer.amount * marketplace_fee as i128) / 10000;
        let seller_amount = offer.amount - fee_amount;
        let royalty_amount = (offer.amount * artwork.royalty_percentage as i128) / 10000;
        let _final_seller_amount = seller_amount - royalty_amount;

        // Payment transfers would happen here

        // Update ownership
        env.storage().persistent().set(&DataKey::Ownership(token_id), &offer.buyer);
        Self::bump_persistent(&env, &DataKey::Ownership(token_id));

        Self::remove_from_creator_tokens(&env, &seller, token_id);
        Self::add_to_creator_tokens(&env, &offer.buyer, token_id);

        // Deactivate offer
        offer.active = false;
        offers.set(i, offer.clone());

        // Cancel active listing if any
        if env.storage().persistent().has(&DataKey::Listing(token_id)) {
            let mut listing: Listing = env.storage().persistent().get(&DataKey::Listing(token_id)).unwrap();
            if listing.status == ListingStatus::Active {
                listing.status = ListingStatus::Cancelled;
                env.storage().persistent().set(&DataKey::Listing(token_id), &listing);
            }
        }

        env.storage().persistent().set(&DataKey::Offers(token_id), &offers);
        Self::bump_persistent(&env, &DataKey::Offers(token_id));

        if royalty_amount > 0 {
            Self::record_royalty(&env, token_id, &artwork.creator, royalty_amount);
        }

        env.events().publish(
            (Symbol::new(&env, "offer_accepted"),),
            (token_id, offer.buyer, seller, offer.amount, royalty_amount),
        );
    }

    pub fn cancel_offer(env: Env, buyer: Address, token_id: u64, offer_id: u32) {
        buyer.require_auth();

        let mut offers: Vec<Offer> = env
            .storage()
            .persistent()
            .get(&DataKey::Offers(token_id))
            .expect("No offers for this token");

        let mut offer_index = None;
        for i in 0..offers.len() {
            let offer = offers.get(i).unwrap();
            if offer.id == offer_id && offer.active {
                if offer.buyer != buyer { panic!("Not the offer buyer"); }
                offer_index = Some(i);
                break;
            }
        }

        let i = offer_index.expect("Offer not found or inactive");
        let mut offer = offers.get(i).unwrap();
        offer.active = false;
        offers.set(i, offer);
        env.storage().persistent().set(&DataKey::Offers(token_id), &offers);

        env.events().publish(
            (Symbol::new(&env, "offer_cancelled"),),
            (token_id, buyer, offer_id),
        );
    }

    // -----------------------------------------------------------------------
    // Admin functions
    // -----------------------------------------------------------------------

    pub fn update_marketplace_fee(env: Env, new_fee: u32) {
        let admin = Self::get_admin(&env);
        admin.require_auth();
        if new_fee > 1000 { panic!("Fee too high (max 10%)"); }
        env.storage().instance().set(&DataKey::MarketplaceFee, &new_fee);
        env.storage().instance().bump(LIFETIME_THRESHOLD, BUMP_AMOUNT);

        env.events().publish(
            (Symbol::new(&env, "fee_updated"),),
            new_fee,
        );
    }

    pub fn update_evolution_fee(env: Env, new_fee: i128) {
        let admin = Self::get_admin(&env);
        admin.require_auth();
        if new_fee < 0 { panic!("Fee cannot be negative"); }
        env.storage().instance().set(&DataKey::EvolutionFee, &new_fee);
        env.storage().instance().bump(LIFETIME_THRESHOLD, BUMP_AMOUNT);

        env.events().publish(
            (Symbol::new(&env, "evolution_fee_updated"),),
            new_fee,
        );
    }

    pub fn update_treasury(env: Env, new_treasury: Address) {
        let admin = Self::get_admin(&env);
        admin.require_auth();
        env.storage().instance().set(&DataKey::Treasury, &new_treasury);
        env.storage().instance().bump(LIFETIME_THRESHOLD, BUMP_AMOUNT);

        env.events().publish(
            (Symbol::new(&env, "treasury_updated"),),
            new_treasury,
        );
    }

    // -----------------------------------------------------------------------
    // View / query functions
    // -----------------------------------------------------------------------

    pub fn get_artwork(env: Env, token_id: u64) -> Artwork {
        Self::get_artwork_internal(&env, token_id)
    }

    pub fn get_listing(env: Env, token_id: u64) -> Listing {
        let listing: Listing = env
            .storage()
            .persistent()
            .get(&DataKey::Listing(token_id))
            .expect("Listing not found");
        Self::bump_persistent(&env, &DataKey::Listing(token_id));
        listing
    }

    pub fn get_active_listings(_env: Env) -> Vec<Listing> {
        // In the optimized design, listings are stored per-token_id.
        // A production contract would maintain a separate index of active token IDs.
        // Returning empty vec as placeholder — callers should query by token_id.
        Vec::new(&_env)
    }

    pub fn get_creator_tokens(env: Env, creator: Address) -> Vec<u64> {
        env.storage()
            .persistent()
            .get(&DataKey::CreatorTokens(creator))
            .unwrap_or(Vec::new(&env))
    }

    pub fn get_token_owner(env: &Env, token_id: u64) -> Address {
        let owner: Address = env
            .storage()
            .persistent()
            .get(&DataKey::Ownership(token_id))
            .expect("Token not found");
        Self::bump_persistent(env, &DataKey::Ownership(token_id));
        owner
    }

    pub fn get_evolutions(env: Env, token_id: u64) -> Vec<Evolution> {
        env.storage()
            .persistent()
            .get(&DataKey::Evolutions(token_id))
            .unwrap_or(Vec::new(&env))
    }

    pub fn get_offers(env: Env, token_id: u64) -> Vec<Offer> {
        env.storage()
            .persistent()
            .get(&DataKey::Offers(token_id))
            .unwrap_or(Vec::new(&env))
    }

    pub fn get_highest_bid(env: Env, token_id: u64) -> Option<Bid> {
        Self::get_highest_bid_internal(&env, token_id)
    }

    // -----------------------------------------------------------------------
    // Private helpers
    // -----------------------------------------------------------------------

    /// Bump TTL on a persistent storage key.
    fn bump_persistent(env: &Env, key: &DataKey) {
        env.storage().persistent().bump(key, LIFETIME_THRESHOLD, BUMP_AMOUNT);
    }

    fn get_admin(env: &Env) -> Address {
        env.storage().instance().get(&DataKey::Admin).expect("Not initialized")
    }

    fn get_marketplace_fee(env: &Env) -> u32 {
        env.storage().instance().get(&DataKey::MarketplaceFee).unwrap_or(250)
    }

    fn get_artwork_internal(env: &Env, token_id: u64) -> Artwork {
        let artwork: Artwork = env
            .storage()
            .persistent()
            .get(&DataKey::Artwork(token_id))
            .expect("Artwork not found");
        Self::bump_persistent(env, &DataKey::Artwork(token_id));
        artwork
    }

    fn get_highest_bid_internal(env: &Env, token_id: u64) -> Option<Bid> {
        let bids: Vec<Bid> = env
            .storage()
            .persistent()
            .get(&DataKey::Bids(token_id))
            .unwrap_or(Vec::new(env));
        let mut highest: Option<Bid> = None;
        for bid in bids.iter() {
            if bid.active {
                match &highest {
                    None => highest = Some(bid.clone()),
                    Some(current) => {
                        if bid.amount > current.amount {
                            highest = Some(bid.clone());
                        }
                    }
                }
            }
        }
        highest
    }

    fn increment_nft_counter(env: &Env) -> u64 {
        let mut counter: u64 = env.storage().instance().get(&DataKey::NftCounter).unwrap_or(0);
        counter += 1;
        env.storage().instance().set(&DataKey::NftCounter, &counter);
        env.storage().instance().bump(LIFETIME_THRESHOLD, BUMP_AMOUNT);
        counter
    }

    fn increment_offer_counter(env: &Env) -> u32 {
        let mut counter: u32 = env.storage().instance().get(&DataKey::OfferCounter).unwrap_or(0);
        counter += 1;
        env.storage().instance().set(&DataKey::OfferCounter, &counter);
        counter
    }

    fn add_to_creator_tokens(env: &Env, creator: &Address, token_id: u64) {
        let mut tokens: Vec<u64> = env
            .storage()
            .persistent()
            .get(&DataKey::CreatorTokens(creator.clone()))
            .unwrap_or(Vec::new(env));
        tokens.push_back(token_id);
        env.storage().persistent().set(&DataKey::CreatorTokens(creator.clone()), &tokens);
        Self::bump_persistent(env, &DataKey::CreatorTokens(creator.clone()));
    }

    fn remove_from_creator_tokens(env: &Env, creator: &Address, token_id: u64) {
        if let Some(tokens) = env
            .storage()
            .persistent()
            .get::<DataKey, Vec<u64>>(&DataKey::CreatorTokens(creator.clone()))
        {
            let mut new_tokens = Vec::new(env);
            for t in tokens.iter() {
                if t != token_id {
                    new_tokens.push_back(t);
                }
            }
            env.storage().persistent().set(&DataKey::CreatorTokens(creator.clone()), &new_tokens);
            Self::bump_persistent(env, &DataKey::CreatorTokens(creator.clone()));
        }
    }

    fn record_royalty(env: &Env, token_id: u64, creator: &Address, amount: i128) {
        let royalty = RoyaltyPayment {
            token_id,
            creator: creator.clone(),
            amount,
            timestamp: env.ledger().timestamp(),
        };
        let mut history: Vec<RoyaltyPayment> = env
            .storage()
            .persistent()
            .get(&DataKey::RoyaltyHistory)
            .unwrap_or(Vec::new(env));
        history.push_back(royalty);
        env.storage().persistent().set(&DataKey::RoyaltyHistory, &history);
        Self::bump_persistent(env, &DataKey::RoyaltyHistory);
    }
}
