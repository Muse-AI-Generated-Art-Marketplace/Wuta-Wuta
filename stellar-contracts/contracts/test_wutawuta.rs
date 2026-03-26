use soroban_sdk::contract::{contract, contractimpl, Address, Env, Symbol};
use soroban_sdk::token::Token;
use soroban_sdk::testutils::{Address as TestAddress, AuthorizedFunction, MockAuth, MockAuthInvoke};
use soroban_sdk::vec::Vec;
use soroban_sdk::map::Map;

mod wutawuta_marketplace;

use wutawuta_marketplace::{
    WutaWutaMarketplace, WutaWutaMarketplaceClient,
    Artwork, Listing, Bid, Evolution, RoyaltyPayment
};

#[test]
fn test_initialization() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let treasury = Address::generate(&env);
    
    let contract_id = env.register_contract(None, WutaWutaMarketplace {});
    let client = WutaWutaMarketplaceClient::new(&env, &contract_id);
    
    client.initialize(
        &admin,
        &250, // 2.5% fee
        &treasury,
        &1000000, // 0.1 XLM evolution fee
        &86400, // 1 day min evolution interval
    );
    
    // Test that initialization worked by checking events
    assert_eq!(env.events().all().len(), 1);
    let event = &env.events().all()[0];
    assert_eq!(event.topics[0], Symbol::new(&env, "marketplace_initialized"));
}

#[test]
fn test_mint_artwork() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let creator = Address::generate(&env);
    let treasury = Address::generate(&env);
    
    let contract_id = env.register_contract(None, WutaWutaMarketplace {});
    let client = WutaWutaMarketplaceClient::new(&env, &contract_id);
    
    client.initialize(&admin, &250, &treasury, &1000000, &86400);
    
    let ipfs_hash = "QmTest123".to_string();
    let title = "Test Artwork".to_string();
    let description = "A test artwork".to_string();
    let ai_model = "Stable Diffusion".to_string();
    let content_hash = [1u8; 32];
    let royalty_percentage = 500; // 5%
    let is_collaborative = true;
    let ai_contribution = 60;
    let human_contribution = 40;
    let can_evolve = true;
    
    let token_id = client.mint_artwork(
        &creator,
        &ipfs_hash,
        &title,
        &description,
        &ai_model,
        &content_hash,
        &royalty_percentage,
        &is_collaborative,
        &ai_contribution,
        &human_contribution,
        &can_evolve,
    );
    
    assert_eq!(token_id, 1);
    
    // Verify artwork was created correctly
    let artwork = client.get_artwork(&token_id);
    assert_eq!(artwork.token_id, token_id);
    assert_eq!(artwork.creator, creator);
    assert_eq!(artwork.ipfs_hash, ipfs_hash);
    assert_eq!(artwork.title, title);
    assert_eq!(artwork.ai_model, ai_model);
    assert_eq!(artwork.royalty_percentage, royalty_percentage);
    assert_eq!(artwork.is_collaborative, is_collaborative);
    assert_eq!(artwork.ai_contribution, ai_contribution);
    assert_eq!(artwork.human_contribution, human_contribution);
    assert_eq!(artwork.can_evolve, can_evolve);
    assert_eq!(artwork.evolution_count, 0);
    
    // Verify ownership
    let owner = client.get_token_owner(&token_id);
    assert_eq!(owner, creator);
    
    // Verify creator's token list
    let creator_tokens = client.get_creator_tokens(&creator);
    assert_eq!(creator_tokens.len(), 1);
    assert_eq!(creator_tokens.get(0), token_id);
    
    // Check events
    assert_eq!(env.events().all().len(), 2); // initialization + mint
    let mint_event = &env.events().all()[1];
    assert_eq!(mint_event.topics[0], Symbol::new(&env, "artwork_minted"));
}

#[test]
fn test_list_artwork_fixed_price() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let creator = Address::generate(&env);
    let treasury = Address::generate(&env);
    
    let contract_id = env.register_contract(None, WutaWutaMarketplace {});
    let client = WutaWutaMarketplaceClient::new(&env, &contract_id);
    
    client.initialize(&admin, &250, &treasury, &1000000, &86400);
    
    // Mint artwork first
    let token_id = client.mint_artwork(
        &creator,
        &"QmTest123".to_string(),
        &"Test Artwork".to_string(),
        &"A test artwork".to_string(),
        &"Stable Diffusion".to_string(),
        &[1u8; 32],
        &500,
        &true,
        &60,
        &40,
        &true,
    );
    
    // List artwork
    let price = 1000000; // 1 XLM
    let duration = 86400; // 1 day
    client.list_artwork(&creator, &token_id, &price, &duration, &false, &None);
    
    // Verify listing
    let listing = client.get_listing(&token_id);
    assert_eq!(listing.token_id, token_id);
    assert_eq!(listing.seller, creator);
    assert_eq!(listing.price, price);
    assert_eq!(listing.duration, duration);
    assert_eq!(listing.active, true);
    assert_eq!(listing.auction_style, false);
    assert_eq!(listing.reserve_price, None);
    
    // Verify it's in active listings
    let active_listings = client.get_active_listings();
    assert_eq!(active_listings.len(), 1);
    assert_eq!(active_listings.get(0).token_id, token_id);
}

#[test]
fn test_list_artwork_auction() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let creator = Address::generate(&env);
    let treasury = Address::generate(&env);
    
    let contract_id = env.register_contract(None, WutaWutaMarketplace {});
    let client = WutaWutaMarketplaceClient::new(&env, &contract_id);
    
    client.initialize(&admin, &250, &treasury, &1000000, &86400);
    
    // Mint artwork first
    let token_id = client.mint_artwork(
        &creator,
        &"QmTest123".to_string(),
        &"Test Artwork".to_string(),
        &"A test artwork".to_string(),
        &"Stable Diffusion".to_string(),
        &[1u8; 32],
        &500,
        &true,
        &60,
        &40,
        &true,
    );
    
    // List artwork as auction
    let price = 500000; // Starting bid 0.5 XLM
    let reserve_price = 1000000; // Reserve 1 XLM
    let duration = 86400; // 1 day
    client.list_artwork(&creator, &token_id, &price, &duration, &true, &Some(reserve_price));
    
    // Verify listing
    let listing = client.get_listing(&token_id);
    assert_eq!(listing.token_id, token_id);
    assert_eq!(listing.seller, creator);
    assert_eq!(listing.price, price);
    assert_eq!(listing.auction_style, true);
    assert_eq!(listing.reserve_price, Some(reserve_price));
}

#[test]
fn test_make_bid() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let creator = Address::generate(&env);
    let bidder = Address::generate(&env);
    let treasury = Address::generate(&env);
    
    let contract_id = env.register_contract(None, WutaWutaMarketplace {});
    let client = WutaWutaMarketplaceClient::new(&env, &contract_id);
    
    client.initialize(&admin, &250, &treasury, &1000000, &86400);
    
    // Mint and list artwork as auction
    let token_id = client.mint_artwork(
        &creator,
        &"QmTest123".to_string(),
        &"Test Artwork".to_string(),
        &"A test artwork".to_string(),
        &"Stable Diffusion".to_string(),
        &[1u8; 32],
        &500,
        &true,
        &60,
        &40,
        &true,
    );
    
    let price = 500000;
    let reserve_price = 1000000;
    let duration = 86400;
    client.list_artwork(&creator, &token_id, &price, &duration, &true, &Some(reserve_price));
    
    // Make a bid
    let bid_amount = 1500000; // 1.5 XLM
    let payment_token = Address::generate(&env);
    
    // Note: In a real test, you'd need to mock the token contract
    // For now, we'll test the bid logic
    client.make_bid(&bidder, &token_id, &bid_amount, &payment_token);
    
    // Verify highest bid
    let highest_bid = client.get_highest_bid(&token_id);
    assert!(highest_bid.is_some());
    assert_eq!(highest_bid.unwrap().bidder, bidder);
    assert_eq!(highest_bid.unwrap().amount, bid_amount);
}

#[test]
fn test_evolve_artwork() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let creator = Address::generate(&env);
    let treasury = Address::generate(&env);
    
    let contract_id = env.register_contract(None, WutaWutaMarketplace {});
    let client = WutaWutaMarketplaceClient::new(&env, &contract_id);
    
    client.initialize(&admin, &250, &treasury, &1000000, &86400);
    
    // Mint artwork
    let token_id = client.mint_artwork(
        &creator,
        &"QmTest123".to_string(),
        &"Test Artwork".to_string(),
        &"A test artwork".to_string(),
        &"Stable Diffusion".to_string(),
        &[1u8; 32],
        &500,
        &true,
        &60,
        &40,
        &true,
    );
    
    // Wait for evolution interval (in test, we'll just set time forward)
    env.ledger().set_timestamp(env.ledger().timestamp() + 86401);
    
    // Evolve artwork
    let prompt = "Make it more colorful".to_string();
    let new_ipfs_hash = "QmEvolved123".to_string();
    let new_content_hash = [2u8; 32];
    let payment_token = Address::generate(&env);
    
    client.evolve_artwork(
        &creator,
        &token_id,
        &prompt,
        &new_ipfs_hash,
        &new_content_hash,
        &payment_token,
    );
    
    // Verify evolution
    let evolutions = client.get_evolutions(&token_id);
    assert_eq!(evolutions.len(), 1);
    assert_eq!(evolutions.get(0).evolution_id, 1);
    assert_eq!(evolutions.get(0).evolver, creator);
    assert_eq!(evolutions.get(0).prompt, prompt);
    assert_eq!(evolutions.get(0).new_ipfs_hash, new_ipfs_hash);
    
    // Verify artwork evolution count updated
    let artwork = client.get_artwork(&token_id);
    assert_eq!(artwork.evolution_count, 1);
}

#[test]
fn test_cancel_listing() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let creator = Address::generate(&env);
    let treasury = Address::generate(&env);
    
    let contract_id = env.register_contract(None, WutaWutaMarketplace {});
    let client = WutaWutaMarketplaceClient::new(&env, &contract_id);
    
    client.initialize(&admin, &250, &treasury, &1000000, &86400);
    
    // Mint and list artwork
    let token_id = client.mint_artwork(
        &creator,
        &"QmTest123".to_string(),
        &"Test Artwork".to_string(),
        &"A test artwork".to_string(),
        &"Stable Diffusion".to_string(),
        &[1u8; 32],
        &500,
        &true,
        &60,
        &40,
        &true,
    );
    
    client.list_artwork(&creator, &token_id, &1000000, &86400, &false, &None);
    
    // Cancel listing
    client.cancel_listing(&creator, &token_id);
    
    // Verify listing is inactive
    let listing = client.get_listing(&token_id);
    assert_eq!(listing.active, false);
    
    // Verify not in active listings
    let active_listings = client.get_active_listings();
    assert_eq!(active_listings.len(), 0);
}

#[test]
fn test_admin_functions() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let treasury = Address::generate(&env);
    let new_treasury = Address::generate(&env);
    
    let contract_id = env.register_contract(None, WutaWutaMarketplace {});
    let client = WutaWutaMarketplaceClient::new(&env, &contract_id);
    
    client.initialize(&admin, &250, &treasury, &1000000, &86400);
    
    // Update marketplace fee
    client.update_marketplace_fee(&300); // 3%
    
    // Update evolution fee
    client.update_evolution_fee(&2000000); // 0.2 XLM
    
    // Update treasury
    client.update_treasury(&new_treasury);
    
    // Verify events were emitted
    let events = env.events().all();
    assert_eq!(events.len(), 4); // init + 3 updates
    
    assert_eq!(events[1].topics[0], Symbol::new(&env, "fee_updated"));
    assert_eq!(events[2].topics[0], Symbol::new(&env, "evolution_fee_updated"));
    assert_eq!(events[3].topics[0], Symbol::new(&env, "treasury_updated"));
}

#[test]
#[should_panic(expected = "Royalty too high")]
fn test_mint_with_high_royalty() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let creator = Address::generate(&env);
    let treasury = Address::generate(&env);
    
    let contract_id = env.register_contract(None, WutaWutaMarketplace {});
    let client = WutaWutaMarketplaceClient::new(&env, &contract_id);
    
    client.initialize(&admin, &250, &treasury, &1000000, &86400);
    
    // Try to mint with royalty > 10%
    client.mint_artwork(
        &creator,
        &"QmTest123".to_string(),
        &"Test Artwork".to_string(),
        &"A test artwork".to_string(),
        &"Stable Diffusion".to_string(),
        &[1u8; 32],
        &1500, // 15% - should fail
        &true,
        &60,
        &40,
        &true,
    );
}

#[test]
#[should_panic(expected = "Already listed")]
fn test_double_listing() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let creator = Address::generate(&env);
    let treasury = Address::generate(&env);
    
    let contract_id = env.register_contract(None, WutaWutaMarketplace {});
    let client = WutaWutaMarketplaceClient::new(&env, &contract_id);
    
    client.initialize(&admin, &250, &treasury, &1000000, &86400);
    
    // Mint artwork
    let token_id = client.mint_artwork(
        &creator,
        &"QmTest123".to_string(),
        &"Test Artwork".to_string(),
        &"A test artwork".to_string(),
        &"Stable Diffusion".to_string(),
        &[1u8; 32],
        &500,
        &true,
        &60,
        &40,
        &true,
    );
    
    // List artwork twice - should fail on second attempt
    client.list_artwork(&creator, &token_id, &1000000, &86400, &false, &None);
    client.list_artwork(&creator, &token_id, &2000000, &86400, &false, &None);
}

#[test]
#[should_panic(expected = "Not the token owner")]
fn test_unauthorized_listing() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let creator = Address::generate(&env);
    let unauthorized = Address::generate(&env);
    let treasury = Address::generate(&env);
    
    let contract_id = env.register_contract(None, WutaWutaMarketplace {});
    let client = WutaWutaMarketplaceClient::new(&env, &contract_id);
    
    client.initialize(&admin, &250, &treasury, &1000000, &86400);
    
    // Mint artwork
    let token_id = client.mint_artwork(
        &creator,
        &"QmTest123".to_string(),
        &"Test Artwork".to_string(),
        &"A test artwork".to_string(),
        &"Stable Diffusion".to_string(),
        &[1u8; 32],
        &500,
        &true,
        &60,
        &40,
        &true,
    );
    
    // Try to list with unauthorized address - should fail
    client.list_artwork(&unauthorized, &token_id, &1000000, &86400, &false, &None);
}

#[test]
fn test_offer_flow() {
    let env = Env::default();
    env.mock_all_auths();
    
    let admin = Address::generate(&env);
    let creator = Address::generate(&env);
    let buyer = Address::generate(&env);
    let treasury = Address::generate(&env);
    let payment_token = Address::generate(&env);
    
    let contract_id = env.register_contract(None, WutaWutaMarketplace {});
    let client = WutaWutaMarketplaceClient::new(&env, &contract_id);
    
    client.initialize(&admin, &250, &treasury, &1000000, &86400);
    
    // Mint artwork
    let token_id = client.mint_artwork(
        &creator,
        &"QmTest123".to_string(),
        &"Test Artwork".to_string(),
        &"A test artwork".to_string(),
        &"Stable Diffusion".to_string(),
        &[1u8; 32],
        &500, // 5% royalty
        &true,
        &60,
        &40,
        &true,
    );

    // Make an offer
    let offer_amount = 2000000; // 2 XLM
    let duration = 3600; // 1 hour
    
    let offer_id = client.make_offer(&buyer, &token_id, &offer_amount, &duration, &payment_token);
    assert_eq!(offer_id, 1);
    
    // Verify offer
    let offers = client.get_offers(&token_id);
    assert_eq!(offers.len(), 1);
    let offer = offers.get(0).unwrap();
    assert_eq!(offer.id, offer_id);
    assert_eq!(offer.buyer, buyer);
    assert_eq!(offer.amount, offer_amount);
    assert_eq!(offer.active, true);

    // Accept offer
    client.accept_offer(&creator, &token_id, &offer_id);
    
    // Verify ownership changed
    let new_owner = client.get_token_owner(&token_id);
    assert_eq!(new_owner, buyer);
    
    // Verify offer became inactive
    let updated_offers = client.get_offers(&token_id);
    assert_eq!(updated_offers.get(0).unwrap().active, false);
}

#[test]
fn test_cancel_offer() {
    let env = Env::default();
    env.mock_all_auths();
    
    let admin = Address::generate(&env);
    let creator = Address::generate(&env);
    let buyer = Address::generate(&env);
    let treasury = Address::generate(&env);
    let payment_token = Address::generate(&env);
    
    let contract_id = env.register_contract(None, WutaWutaMarketplace {});
    let client = WutaWutaMarketplaceClient::new(&env, &contract_id);
    
    client.initialize(&admin, &250, &treasury, &1000000, &86400);
    
    let token_id = client.mint_artwork(
        &creator,
        &"QmTest123".to_string(),
        &"Test Artwork".to_string(),
        &"A test artwork".to_string(),
        &"Stable Diffusion".to_string(),
        &[1u8; 32],
        &500,
        &true,
        &60,
        &40,
        &true,
    );

    let offer_id = client.make_offer(&buyer, &token_id, &1000000, &3600, &payment_token);
    
    // Cancel offer
    client.cancel_offer(&buyer, &token_id, &offer_id);
    
    // Verify offer is inactive
    let offers = client.get_offers(&token_id);
    assert_eq!(offers.get(0).unwrap().active, false);
}
