use soroban_sdk::contract::{contract, contractimpl, Address, Env, Symbol};
use soroban_sdk::token::Token;
use soroban_sdk::crypto::sha256;
use soroban_sdk::vec::Vec;
use soroban_sdk::map::Map;
use soroban_sdk::unwrap::UnwrapOptimized;

#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub struct Artwork {
    pub token_id: u64,
    pub creator: Address,
    pub ipfs_hash: String,
    pub title: String,
    pub description: String,
    pub ai_model: String,
    pub creation_timestamp: u64,
    pub content_hash: [u8; 32],
    pub royalty_percentage: u32, // basis points (100 = 1%)
    pub is_collaborative: bool,
    pub ai_contribution: u32, // percentage
    pub human_contribution: u32, // percentage
    pub can_evolve: bool,
    pub evolution_count: u32,
}

#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub struct Listing {
    pub token_id: u64,
    pub seller: Address,
    pub price: i128,
    pub start_time: u64,
    pub duration: u64,
    pub active: bool,
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

#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub struct Evolution {
    pub token_id: u64,
    pub evolution_id: u32,
    pub evolver: Address,
    pub prompt: String,
    pub new_ipfs_hash: String,
    pub timestamp: u64,
    pub content_hash: [u8; 32],
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

#[contract]
pub struct WutaWutaMarketplace {
    admin: Address,
    nft_counter: u64,
    marketplace_fee: u32, // basis points (100 = 1%)
    treasury: Address,
    evolution_fee: i128,
    min_evolution_interval: u64,
}

#[contractimpl]
impl WutaWutaMarketplace {
    pub fn initialize(
        env: Env,
        admin: Address,
        marketplace_fee: u32,
        treasury: Address,
        evolution_fee: i128,
        min_evolution_interval: u64,
    ) {
        env.storage().instance().set(&admin);
        env.storage().instance().set(&0u64); // nft_counter
        env.storage().instance().set(&marketplace_fee);
        env.storage().instance().set(&treasury);
        env.storage().instance().set(&evolution_fee);
        env.storage().instance().set(&min_evolution_interval);

        // Initialize storage maps
        env.storage().instance().set(&Map::<Address, Vec<u64>>::new(&env));
        env.storage().instance().set(&Map::<u64, Artwork>::new(&env));
        env.storage().instance().set(&Map::<u64, Listing>::new(&env));
        env.storage().instance().set(&Vec::<Bid>::new(&env));
        env.storage().instance().set(&Map::<u64, Vec<Evolution>>::new(&env));
        env.storage().instance().set(&Map::<u64, Address>::new(&env)); // token ownership
        env.storage().instance().set(&Map::<u64, Vec<Offer>>::new(&env));
        env.storage().instance().set(&0u32); // offer_counter

        // Emit initialization event
        env.events().publish(
            (Symbol::new(&env, "marketplace_initialized"),),
            (admin, marketplace_fee, treasury),
        );
    }

    // Mint new artwork
    pub fn mint_artwork(
        env: Env,
        creator: Address,
        ipfs_hash: String,
        title: String,
        description: String,
        ai_model: String,
        content_hash: [u8; 32],
        royalty_percentage: u32,
        is_collaborative: bool,
        ai_contribution: u32,
        human_contribution: u32,
        can_evolve: bool,
    ) -> u64 {
        let admin = Self::get_admin(env.clone());
        admin.require_auth();

        // Validate inputs
        if ipfs_hash.is_empty() { panic!("IPFS hash required"); }
        if title.is_empty() { panic!("Title required"); }
        if ai_model.is_empty() { panic!("AI model required"); }
        if royalty_percentage > 1000 { panic!("Royalty too high (max 10%)"); }
        
        if is_collaborative {
            if ai_contribution + human_contribution != 100 {
                panic!("Contributions must sum to 100");
            }
        }

        let token_id = Self::increment_nft_counter(env.clone());
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

        // Store artwork
        let mut artworks = Self::get_artworks(env.clone());
        artworks.set(token_id, artwork.clone());
        env.storage().instance().set(&artworks);

        // Update creator's token list
        let mut creator_tokens = Self::get_creator_tokens(env.clone(), creator.clone());
        creator_tokens.push_back(token_id);
        let mut token_map = Self::get_creator_tokens_map(env.clone());
        token_map.set(creator, creator_tokens);
        env.storage().instance().set(&token_map);

        // Set ownership
        let mut ownership = Self::get_ownership_map(env.clone());
        ownership.set(token_id, creator);
        env.storage().instance().set(&ownership);

        // Emit mint event
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

    // List artwork for sale
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

        // Verify ownership
        let owner = Self::get_token_owner(env.clone(), token_id);
        if owner != seller { panic!("Not the token owner"); }

        // Verify not already listed
        let listings = Self::get_listings_map(env.clone());
        if listings.contains_key(token_id) { panic!("Already listed"); }

        // Validate inputs
        if price <= 0 { panic!("Price must be positive"); }
        if duration <= 0 { panic!("Duration must be positive"); }
        if duration > 2592000 { panic!("Duration too long (max 30 days)"); }

        if auction_style {
            if reserve_price.is_none() { panic!("Reserve price required for auctions"); }
            if reserve_price.unwrap() <= 0 { panic!("Reserve price must be positive"); }
        }

        let start_time = env.ledger().timestamp();
        let listing = Listing {
            token_id,
            seller: seller.clone(),
            price,
            start_time,
            duration,
            active: true,
            auction_style,
            reserve_price,
        };

        // Store listing
        let mut listings_map = Self::get_listings_map(env.clone());
        listings_map.set(token_id, listing);
        env.storage().instance().set(&listings_map);

        // Emit listing event
        env.events().publish(
            (Symbol::new(&env, "artwork_listed"),),
            (token_id, seller, price, duration, auction_style),
        );
    }

    // Purchase artwork (fixed price)
    pub fn buy_artwork(env: Env, buyer: Address, token_id: u64, payment_token: Address) {
        buyer.require_auth();

        let listings = Self::get_listings_map(env.clone());
        let listing = listings.get(token_id).unwrap_optimized();
        if !listing.active { panic!("Listing not active"); }
        if listing.auction_style { panic!("Use auction functions for auction listings"); }
        if env.ledger().timestamp() >= listing.start_time + listing.duration { panic!("Listing expired"); }

        let marketplace_fee = Self::get_marketplace_fee(env.clone());
        let treasury = Self::get_treasury(env.clone());
        let artwork = Self::get_artwork(env.clone(), token_id);
        
        // Calculate fees
        let fee_amount = (listing.price * marketplace_fee as i128) / 10000;
        let seller_amount = listing.price - fee_amount;
        let royalty_amount = (listing.price * artwork.royalty_percentage as i128) / 10000;
        let final_seller_amount = seller_amount - royalty_amount;

        // Process payment transfers
        let payment_token_contract = Token::new(&env, &payment_token);
        
        // Transfer from buyer to treasury (marketplace fee)
        payment_token_contract.transfer(&buyer, &treasury, &fee_amount);
        
        // Transfer from buyer to creator (royalty)
        if royalty_amount > 0 {
            payment_token_contract.transfer(&buyer, &artwork.creator, &royalty_amount);
        }
        
        // Transfer from buyer to seller
        payment_token_contract.transfer(&buyer, &listing.seller, &final_seller_amount);

        // Update ownership
        let mut ownership = Self::get_ownership_map(env.clone());
        ownership.set(token_id, buyer.clone());
        env.storage().instance().set(&ownership);

        // Update seller's token list
        Self::remove_from_creator_tokens(env.clone(), listing.seller.clone(), token_id);
        let mut buyer_tokens = Self::get_creator_tokens(env.clone(), buyer.clone());
        buyer_tokens.push_back(token_id);
        let mut token_map = Self::get_creator_tokens_map(env.clone());
        token_map.set(buyer, buyer_tokens);
        env.storage().instance().set(&token_map);

        // Deactivate listing
        let mut updated_listings = listings;
        let mut updated_listing = listing;
        updated_listing.active = false;
        updated_listings.set(token_id, updated_listing);
        env.storage().instance().set(&updated_listings);

        // Record royalty payment
        if royalty_amount > 0 {
            let royalty_payment = RoyaltyPayment {
                token_id,
                creator: artwork.creator,
                amount: royalty_amount,
                timestamp: env.ledger().timestamp(),
            };
            let mut royalty_history = Self::get_royalty_history(env.clone());
            royalty_history.push_back(royalty_payment);
            env.storage().instance().set(&royalty_history);
        }

        // Emit sale event
        env.events().publish(
            (Symbol::new(&env, "artwork_sold"),),
            (
                token_id,
                buyer,
                listing.seller,
                listing.price,
                fee_amount,
                royalty_amount,
            ),
        );
    }

    // Make bid on auction
    pub fn make_bid(env: Env, bidder: Address, token_id: u64, amount: i128, payment_token: Address) {
        bidder.require_auth();

        let listings = Self::get_listings_map(env.clone());
        let listing = listings.get(token_id).unwrap_optimized();
        require!(listing.active, "Listing not active");
        require!(listing.auction_style, "Not an auction listing");
        require!(env.ledger().timestamp() < listing.start_time + listing.duration, "Auction expired");

        // Check minimum bid (reserve price or current highest bid + 5%)
        let min_bid = if let Some(reserve) = listing.reserve_price {
            reserve.max(amount)
        } else {
            listing.price
        };

        let current_highest = Self::get_highest_bid(env.clone(), token_id);
        let min_required = if let Some(highest) = current_highest {
            (highest.amount * 105) / 100 // 5% increment
        } else {
            min_bid
        };

        require!(amount >= min_required, "Bid too low");

        // Process payment (hold in escrow)
        let payment_token_contract = Token::new(&env, &payment_token);
        payment_token_contract.transfer(&bidder, &env.current_contract_address(), &amount);

        // Refund previous highest bidder if exists
        if let Some(highest) = current_highest {
            payment_token_contract.transfer(&env.current_contract_address(), &highest.bidder, &highest.amount);
        }

        // Store new bid
        let bid = Bid {
            token_id,
            bidder: bidder.clone(),
            amount,
            timestamp: env.ledger().timestamp(),
            active: true,
        };

        let mut bids = Self::get_bids(env.clone());
        // Deactivate previous bids for this token
        for mut existing_bid in bids.iter() {
            if existing_bid.token_id == token_id && existing_bid.active {
                existing_bid.active = false;
            }
        }
        bids.push_back(bid);
        env.storage().instance().set(&bids);

        // Emit bid event
        env.events().publish(
            (Symbol::new(&env, "bid_made"),),
            (token_id, bidder, amount),
        );
    }

    // End auction and transfer to highest bidder
    pub fn end_auction(env: Env, token_id: u64, payment_token: Address) {
        let listings = Self::get_listings_map(env.clone());
        let listing = listings.get(token_id).unwrap_optimized();
        require!(listing.active, "Listing not active");
        require!(listing.auction_style, "Not an auction listing");
        require!(env.ledger().timestamp() >= listing.start_time + listing.duration, "Auction not ended");

        let highest_bid = Self::get_highest_bid(env.clone(), token_id);
        require!(highest_bid.is_some(), "No bids found");

        let bid = highest_bid.unwrap();
        
        // Check if reserve price met
        if let Some(reserve) = listing.reserve_price {
            require!(bid.amount >= reserve, "Reserve price not met");
        }

        let marketplace_fee = Self::get_marketplace_fee(env.clone());
        let treasury = Self::get_treasury(env.clone());
        let artwork = Self::get_artwork(env.clone(), token_id);
        
        // Calculate fees
        let fee_amount = (bid.amount * marketplace_fee as i128) / 10000;
        let seller_amount = bid.amount - fee_amount;
        let royalty_amount = (bid.amount * artwork.royalty_percentage as i128) / 10000;
        let final_seller_amount = seller_amount - royalty_amount;

        let payment_token_contract = Token::new(&env, &payment_token);
        
        // Transfer fee to treasury
        payment_token_contract.transfer(&env.current_contract_address(), &treasury, &fee_amount);
        
        // Transfer royalty to creator
        if royalty_amount > 0 {
            payment_token_contract.transfer(&env.current_contract_address(), &artwork.creator, &royalty_amount);
        }
        
        // Transfer to seller
        payment_token_contract.transfer(&env.current_contract_address(), &listing.seller, &final_seller_amount);

        // Update ownership
        let mut ownership = Self::get_ownership_map(env.clone());
        ownership.set(token_id, bid.bidder.clone());
        env.storage().instance().set(&ownership);

        // Update token lists
        Self::remove_from_creator_tokens(env.clone(), listing.seller.clone(), token_id);
        let mut buyer_tokens = Self::get_creator_tokens(env.clone(), bid.bidder.clone());
        buyer_tokens.push_back(token_id);
        let mut token_map = Self::get_creator_tokens_map(env.clone());
        token_map.set(bid.bidder, buyer_tokens);
        env.storage().instance().set(&token_map);

        // Deactivate listing
        let mut updated_listings = listings;
        let mut updated_listing = listing;
        updated_listing.active = false;
        updated_listings.set(token_id, updated_listing);
        env.storage().instance().set(&updated_listings);

        // Emit auction ended event
        env.events().publish(
            (Symbol::new(&env, "auction_ended"),),
            (
                token_id,
                bid.bidder,
                listing.seller,
                bid.amount,
                fee_amount,
                royalty_amount,
            ),
        );
    }

    // Evolve artwork
    pub fn evolve_artwork(
        env: Env,
        evolver: Address,
        token_id: u64,
        prompt: String,
        new_ipfs_hash: String,
        content_hash: [u8; 32],
        payment_token: Address,
    ) {
        evolver.require_auth();

        let owner = Self::get_token_owner(env.clone(), token_id);
        require!(owner == evolver, "Not the token owner");

        let artwork = Self::get_artwork(env.clone(), token_id);
        require!(artwork.can_evolve, "Artwork cannot evolve");
        
        let min_interval = Self::get_min_evolution_interval(env.clone());
        require!(
            env.ledger().timestamp() >= artwork.creation_timestamp + min_interval,
            "Evolution interval not met"
        );

        let evolution_fee = Self::get_evolution_fee(env.clone());
        let treasury = Self::get_treasury(env.clone());

        // Pay evolution fee
        if evolution_fee > 0 {
            let payment_token_contract = Token::new(&env, &payment_token);
            payment_token_contract.transfer(&evolver, &treasury, &evolution_fee);
        }

        // Create evolution record
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

        // Store evolution
        let mut evolutions = Self::get_evolutions(env.clone());
        if !evolutions.contains_key(&token_id) {
            evolutions.set(token_id, Vec::new(&env));
        }
        let mut token_evolutions = evolutions.get(token_id).unwrap_optimized();
        token_evolutions.push_back(evolution);
        evolutions.set(token_id, token_evolutions);
        env.storage().instance().set(&evolutions);

        // Update artwork
        let mut updated_artwork = artwork;
        updated_artwork.evolution_count = evolution_id;
        let mut artworks = Self::get_artworks(env.clone());
        artworks.set(token_id, updated_artwork);
        env.storage().instance().set(&artworks);

        // Emit evolution event
        env.events().publish(
            (Symbol::new(&env, "artwork_evolved"),),
            (token_id, evolution_id, evolver, prompt, new_ipfs_hash),
        );
    }

    // Cancel listing
    pub fn cancel_listing(env: Env, seller: Address, token_id: u64) {
        seller.require_auth();

        let listings = Self::get_listings_map(env.clone());
        let listing = listings.get(token_id).unwrap_optimized();
        require!(listing.seller == seller, "Not the seller");
        require!(listing.active, "Listing not active");

        // Deactivate listing
        let mut updated_listings = listings;
        let mut updated_listing = listing;
        updated_listing.active = false;
        updated_listings.set(token_id, updated_listing);
        env.storage().instance().set(&updated_listings);

        // Refund highest bidder if auction
        if listing.auction_style {
            if let Some(highest_bid) = Self::get_highest_bid(env.clone(), token_id) {
                let bids = Self::get_bids(env.clone());
                for bid in bids.iter() {
                    if bid.token_id == token_id && bid.active {
                        // Refund logic would be handled by the payment token contract
                        break;
                    }
                }
            }
        }

        // Emit cancel event
        env.events().publish(
            (Symbol::new(&env, "listing_cancelled"),),
            (token_id, seller),
        );
    }

    // Admin functions
    // Make an offer on an artwork
    pub fn make_offer(
        env: Env,
        buyer: Address,
        token_id: u64,
        amount: i128,
        duration: u64,
        payment_token: Address,
    ) -> u32 {
        buyer.require_auth();

        // Check if artwork exists
        let _artwork = Self::get_artwork(env.clone(), token_id);
        
        // Check if not already owned by buyer
        let owner = Self::get_token_owner(env.clone(), token_id);
        if owner == buyer { panic!("Already own this token"); }

        if amount <= 0 { panic!("Amount must be positive"); }
        if duration <= 0 { panic!("Duration must be positive"); }

        // Process payment (hold in escrow)
        let payment_token_contract = Token::new(&env, &payment_token);
        payment_token_contract.transfer(&buyer, &env.current_contract_address(), &amount);

        let offer_id = Self::increment_offer_counter(env.clone());
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

        // Store offer
        let mut offers_map = Self::get_offers_map(env.clone());
        let mut token_offers = offers_map.get(token_id).unwrap_or(Vec::new(&env));
        token_offers.push_back(offer);
        offers_map.set(token_id, token_offers);
        env.storage().instance().set(&offers_map);

        // Emit offer event
        env.events().publish(
            (Symbol::new(&env, "offer_made"),),
            (token_id, buyer, amount, expires, offer_id),
        );

        offer_id
    }

    // Accept an offer
    pub fn accept_offer(env: Env, seller: Address, token_id: u64, offer_id: u32) {
        seller.require_auth();

        // Verify ownership
        let owner = Self::get_token_owner(env.clone(), token_id);
        if owner != seller { panic!("Not the token owner"); }

        // Find the offer
        let mut offers_map = Self::get_offers_map(env.clone());
        let mut token_offers = offers_map.get(token_id).expect("No offers for this token");
        
        let mut offer_index = None;
        for (i, offer) in token_offers.iter().enumerate() {
            if offer.id == offer_id && offer.active {
                if env.ledger().timestamp() >= offer.expires {
                    panic!("Offer expired");
                }
                offer_index = Some(i as u32);
                break;
            }
        }

        let i = offer_index.expect("Offer not found or inactive");
        let mut offer = token_offers.get(i).unwrap();

        let marketplace_fee = Self::get_marketplace_fee(env.clone());
        let treasury = Self::get_treasury(env.clone());
        let artwork = Self::get_artwork(env.clone(), token_id);
        
        // Calculate fees and royalties
        let fee_amount = (offer.amount * marketplace_fee as i128) / 10000;
        let seller_amount = offer.amount - fee_amount;
        let royalty_amount = (offer.amount * artwork.royalty_percentage as i128) / 10000;
        let final_seller_amount = seller_amount - royalty_amount;

        let payment_token_contract = Token::new(&env, &offer.payment_token);
        
        // Transfer marketplace fee to treasury
        if fee_amount > 0 {
            payment_token_contract.transfer(&env.current_contract_address(), &treasury, &fee_amount);
        }
        
        // Transfer royalty to original creator
        if royalty_amount > 0 {
            payment_token_contract.transfer(&env.current_contract_address(), &artwork.creator, &royalty_amount);
        }
        
        // Transfer remaining amount to seller
        if final_seller_amount > 0 {
            payment_token_contract.transfer(&env.current_contract_address(), &seller, &final_seller_amount);
        }

        // Update ownership
        let mut ownership = Self::get_ownership_map(env.clone());
        ownership.set(token_id, offer.buyer.clone());
        env.storage().instance().set(&ownership);

        // Update token lists
        Self::remove_from_creator_tokens(env.clone(), seller.clone(), token_id);
        let mut buyer_tokens = Self::get_creator_tokens(env.clone(), offer.buyer.clone());
        buyer_tokens.push_back(token_id);
        let mut token_map = Self::get_creator_tokens_map(env.clone());
        token_map.set(offer.buyer.clone(), buyer_tokens);
        env.storage().instance().set(&token_map);

        // Mark offer as used and deactivate others for this token
        offer.active = false;
        token_offers.set(i, offer.clone());
        
        // Also cancel any active listings for this token
        let mut listings = Self::get_listings_map(env.clone());
        if let Some(mut listing) = listings.get(token_id) {
            if listing.active {
                listing.active = false;
                listings.set(token_id, listing);
                env.storage().instance().set(&listings);
            }
        }

        offers_map.set(token_id, token_offers);
        env.storage().instance().set(&offers_map);

        // Record royalty payment
        if royalty_amount > 0 {
            let royalty_payment = RoyaltyPayment {
                token_id,
                creator: artwork.creator,
                amount: royalty_amount,
                timestamp: env.ledger().timestamp(),
            };
            let mut royalty_history = Self::get_royalty_history(env.clone());
            royalty_history.push_back(royalty_payment);
            env.storage().instance().set(&royalty_history);
        }

        // Emit offer accepted event
        env.events().publish(
            (Symbol::new(&env, "offer_accepted"),),
            (token_id, offer.buyer, seller, offer.amount, royalty_amount),
        );
    }

    // Cancel an offer (by buyer)
    pub fn cancel_offer(env: Env, buyer: Address, token_id: u64, offer_id: u32) {
        buyer.require_auth();

        let mut offers_map = Self::get_offers_map(env.clone());
        let mut token_offers = offers_map.get(token_id).expect("No offers for this token");
        
        let mut offer_index = None;
        for (i, offer) in token_offers.iter().enumerate() {
            if offer.id == offer_id && offer.active {
                if offer.buyer != buyer { panic!("Not the offer buyer"); }
                offer_index = Some(i as u32);
                break;
            }
        }

        let i = offer_index.expect("Offer not found or inactive");
        let mut offer = token_offers.get(i).unwrap();

        // Refund escrowed payment
        let payment_token_contract = Token::new(&env, &offer.payment_token);
        payment_token_contract.transfer(&env.current_contract_address(), &buyer, &offer.amount);

        // Mark offer as inactive
        offer.active = false;
        token_offers.set(i, offer);
        offers_map.set(token_id, token_offers);
        env.storage().instance().set(&offers_map);

        // Emit offer cancelled event
        env.events().publish(
            (Symbol::new(&env, "offer_cancelled"),),
            (token_id, buyer, offer_id),
        );
    }

    pub fn update_marketplace_fee(env: Env, new_fee: u32) {
        let admin = Self::get_admin(env.clone());
        admin.require_auth();
        require!(new_fee <= 1000, "Fee too high (max 10%)");
        env.storage().instance().set(&new_fee);

        env.events().publish(
            (Symbol::new(&env, "fee_updated"),),
            new_fee,
        );
    }

    pub fn update_evolution_fee(env: Env, new_fee: i128) {
        let admin = Self::get_admin(env.clone());
        admin.require_auth();
        require!(new_fee >= 0, "Fee cannot be negative");
        env.storage().instance().set(&new_fee);

        env.events().publish(
            (Symbol::new(&env, "evolution_fee_updated"),),
            new_fee,
        );
    }

    pub fn update_treasury(env: Env, new_treasury: Address) {
        let admin = Self::get_admin(env.clone());
        admin.require_auth();
        env.storage().instance().set(&new_treasury);

        env.events().publish(
            (Symbol::new(&env, "treasury_updated"),),
            new_treasury,
        );
    }

    // View functions
    pub fn get_artwork(env: Env, token_id: u64) -> Artwork {
        let artworks = Self::get_artworks(env);
        artworks.get(token_id).unwrap_optimized()
    }

    pub fn get_listing(env: Env, token_id: u64) -> Listing {
        let listings = Self::get_listings_map(env);
        listings.get(token_id).unwrap_optimized()
    }

    pub fn get_active_listings(env: Env) -> Vec<Listing> {
        let listings = Self::get_listings_map(env);
        let mut active_listings = Vec::new(&env);
        let current_time = env.ledger().timestamp();

        for (token_id, listing) in listings.iter() {
            if listing.active && current_time < listing.start_time + listing.duration {
                active_listings.push_back(listing);
            }
        }

        active_listings
    }

    pub fn get_creator_tokens(env: Env, creator: Address) -> Vec<u64> {
        let token_map = Self::get_creator_tokens_map(env);
        token_map.get(creator).unwrap_or_default()
    }

    pub fn get_token_owner(env: Env, token_id: u64) -> Address {
        let ownership = Self::get_ownership_map(env);
        ownership.get(token_id).unwrap_optimized()
    }

    pub fn get_evolutions(env: Env, token_id: u64) -> Vec<Evolution> {
        let evolutions = Self::get_evolutions(env);
        evolutions.get(token_id).unwrap_or_default()
    }

    pub fn get_offers(env: Env, token_id: u64) -> Vec<Offer> {
        let offers_map = Self::get_offers_map(env);
        offers_map.get(token_id).unwrap_or(Vec::new(&env))
    }

    pub fn get_highest_bid(env: Env, token_id: u64) -> Option<Bid> {
        let bids = Self::get_bids(env);
        let mut highest_bid: Option<Bid> = None;

        for bid in bids.iter() {
            if bid.token_id == token_id && bid.active {
                match &highest_bid {
                    None => highest_bid = Some(bid.clone()),
                    Some(current) => {
                        if bid.amount > current.amount {
                            highest_bid = Some(bid.clone());
                        }
                    }
                }
            }
        }

        highest_bid
    }

    // Private helper functions
    fn get_admin(env: Env) -> Address {
        env.storage().instance().get(&Address::default()).unwrap_optimized()
    }

    fn increment_nft_counter(env: Env) -> u64 {
        let mut counter = env.storage().instance().get(&0u64).unwrap_optimized();
        counter += 1;
        env.storage().instance().set(&counter);
        counter
    }

    fn increment_offer_counter(env: Env) -> u32 {
        let mut counter = env.storage().instance().get(&0u32).unwrap_or(0);
        counter += 1;
        env.storage().instance().set(&counter);
        counter
    }

    fn get_marketplace_fee(env: Env) -> u32 {
        env.storage().instance().get(&0u32).unwrap_or(250) // Default 2.5%
    }

    fn get_treasury(env: Env) -> Address {
        env.storage().instance().get(&Address::default()).unwrap_optimized()
    }

    fn get_evolution_fee(env: Env) -> i128 {
        env.storage().instance().get(&0i128).unwrap_or(1000000) // Default 0.1 XLM
    }

    fn get_min_evolution_interval(env: Env) -> u64 {
        env.storage().instance().get(&0u64).unwrap_or(86400) // Default 1 day
    }

    fn get_artworks(env: Env) -> Map<u64, Artwork> {
        env.storage().instance().get(&Map::<u64, Artwork>::new(&env)).unwrap_or_default()
    }

    fn get_listings_map(env: Env) -> Map<u64, Listing> {
        env.storage().instance().get(&Map::<u64, Listing>::new(&env)).unwrap_or_default()
    }

    fn get_creator_tokens_map(env: Env) -> Map<Address, Vec<u64>> {
        env.storage().instance().get(&Map::<Address, Vec<u64>>::new(&env)).unwrap_or_default()
    }

    fn get_ownership_map(env: Env) -> Map<u64, Address> {
        env.storage().instance().get(&Map::<u64, Address>::new(&env)).unwrap_or_default()
    }

    fn get_bids(env: Env) -> Vec<Bid> {
        env.storage().instance().get(&Vec::<Bid>::new(&env)).unwrap_or_default()
    }

    fn get_evolutions(env: Env) -> Map<u64, Vec<Evolution>> {
        env.storage().instance().get(&Map::<u64, Vec<Evolution>>::new(&env)).unwrap_or_default()
    }

    fn get_offers_map(env: Env) -> Map<u64, Vec<Offer>> {
        env.storage().instance().get(&Map::<u64, Vec<Offer>>::new(&env)).unwrap_or_default()
    }

    fn get_royalty_history(env: Env) -> Vec<RoyaltyPayment> {
        env.storage().instance().get(&Vec::<RoyaltyPayment>::new(&env)).unwrap_or_default()
    }

    fn remove_from_creator_tokens(env: Env, creator: Address, token_id: u64) {
        let mut token_map = Self::get_creator_tokens_map(env.clone());
        if let Some(mut tokens) = token_map.get(creator) {
            let mut new_tokens = Vec::new(&env);
            for token in tokens.iter() {
                if *token != token_id {
                    new_tokens.push_back(*token);
                }
            }
            token_map.set(creator, new_tokens);
            env.storage().instance().set(&token_map);
        }
    }
}
