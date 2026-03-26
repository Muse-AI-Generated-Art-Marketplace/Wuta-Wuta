// ============================================================================
// test_wutawuta.rs — Tests updated for optimized storage (Issue #42)
//
// Changes from original:
// - ai_model parameter changed from String → Symbol
// - content_hash parameter changed from [u8; 32] → BytesN<32>
// - ListingStatus enum used instead of bool `active`
// ============================================================================

use soroban_sdk::{
    contract, contractimpl, contracttype, Address, BytesN, Env, String, Symbol, Vec,
};
use soroban_sdk::testutils::Address as _;

mod wutawuta_marketplace;

use wutawuta_marketplace::{
    WutaWutaMarketplace, WutaWutaMarketplaceClient,
    Artwork, Listing, ListingStatus, Bid, Evolution, Offer, RoyaltyPayment,
};

// Helper to create a BytesN<32> for tests
fn test_content_hash(env: &Env, fill: u8) -> BytesN<32> {
    BytesN::from_array(env, &[fill; 32])
}

#[test]
fn test_initialization() {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let treasury = Address::generate(&env);

    let contract_id = env.register_contract(None, WutaWutaMarketplace);
    let client = WutaWutaMarketplaceClient::new(&env, &contract_id);

    client.initialize(
        &admin,
        &250,        // 2.5% fee
        &treasury,
        &1000000,    // 0.1 XLM evolution fee
        &86400,      // 1 day min evolution interval
    );

    // Test that initialization worked by checking events
    assert!(env.events().all().len() >= 1);
}

#[test]
fn test_mint_artwork() {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let creator = Address::generate(&env);
    let treasury = Address::generate(&env);

    let contract_id = env.register_contract(None, WutaWutaMarketplace);
    let client = WutaWutaMarketplaceClient::new(&env, &contract_id);

    client.initialize(&admin, &250, &treasury, &1000000, &86400);

    let ipfs_hash = String::from_str(&env, "QmTest123");
    let title = String::from_str(&env, "Test Artwork");
    let description = String::from_str(&env, "A test artwork");
    let ai_model = Symbol::new(&env, "StableDiffusion");
    let content_hash = test_content_hash(&env, 1);
    let royalty_percentage = 500u32; // 5%
    let is_collaborative = true;
    let ai_contribution = 60u32;
    let human_contribution = 40u32;
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
}

#[test]
fn test_list_artwork_fixed_price() {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let creator = Address::generate(&env);
    let treasury = Address::generate(&env);

    let contract_id = env.register_contract(None, WutaWutaMarketplace);
    let client = WutaWutaMarketplaceClient::new(&env, &contract_id);

    client.initialize(&admin, &250, &treasury, &1000000, &86400);

    let token_id = client.mint_artwork(
        &creator,
        &String::from_str(&env, "QmTest123"),
        &String::from_str(&env, "Test Artwork"),
        &String::from_str(&env, "A test artwork"),
        &Symbol::new(&env, "StableDiffusion"),
        &test_content_hash(&env, 1),
        &500,
        &true,
        &60,
        &40,
        &true,
    );

    let price = 1000000i128;
    let duration = 86400u64;
    client.list_artwork(&creator, &token_id, &price, &duration, &false, &None);

    // Verify listing
    let listing = client.get_listing(&token_id);
    assert_eq!(listing.token_id, token_id);
    assert_eq!(listing.seller, creator);
    assert_eq!(listing.price, price);
    assert_eq!(listing.duration, duration);
    assert_eq!(listing.status, ListingStatus::Active);
    assert_eq!(listing.auction_style, false);
    assert_eq!(listing.reserve_price, None);
}

#[test]
fn test_list_artwork_auction() {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let creator = Address::generate(&env);
    let treasury = Address::generate(&env);

    let contract_id = env.register_contract(None, WutaWutaMarketplace);
    let client = WutaWutaMarketplaceClient::new(&env, &contract_id);

    client.initialize(&admin, &250, &treasury, &1000000, &86400);

    let token_id = client.mint_artwork(
        &creator,
        &String::from_str(&env, "QmTest123"),
        &String::from_str(&env, "Test Artwork"),
        &String::from_str(&env, "A test artwork"),
        &Symbol::new(&env, "StableDiffusion"),
        &test_content_hash(&env, 1),
        &500,
        &true,
        &60,
        &40,
        &true,
    );

    let price = 500000i128;
    let reserve_price = 1000000i128;
    let duration = 86400u64;
    client.list_artwork(&creator, &token_id, &price, &duration, &true, &Some(reserve_price));

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
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let creator = Address::generate(&env);
    let bidder = Address::generate(&env);
    let treasury = Address::generate(&env);

    let contract_id = env.register_contract(None, WutaWutaMarketplace);
    let client = WutaWutaMarketplaceClient::new(&env, &contract_id);

    client.initialize(&admin, &250, &treasury, &1000000, &86400);

    let token_id = client.mint_artwork(
        &creator,
        &String::from_str(&env, "QmTest123"),
        &String::from_str(&env, "Test Artwork"),
        &String::from_str(&env, "A test artwork"),
        &Symbol::new(&env, "StableDiffusion"),
        &test_content_hash(&env, 1),
        &500,
        &true,
        &60,
        &40,
        &true,
    );

    let price = 500000i128;
    let reserve_price = 1000000i128;
    let duration = 86400u64;
    client.list_artwork(&creator, &token_id, &price, &duration, &true, &Some(reserve_price));

    let bid_amount = 1500000i128;
    let payment_token = Address::generate(&env);

    client.make_bid(&bidder, &token_id, &bid_amount, &payment_token);

    let highest_bid = client.get_highest_bid(&token_id);
    assert!(highest_bid.is_some());
    let bid = highest_bid.unwrap();
    assert_eq!(bid.bidder, bidder);
    assert_eq!(bid.amount, bid_amount);
}

#[test]
fn test_evolve_artwork() {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let creator = Address::generate(&env);
    let treasury = Address::generate(&env);

    let contract_id = env.register_contract(None, WutaWutaMarketplace);
    let client = WutaWutaMarketplaceClient::new(&env, &contract_id);

    client.initialize(&admin, &250, &treasury, &1000000, &86400);

    let token_id = client.mint_artwork(
        &creator,
        &String::from_str(&env, "QmTest123"),
        &String::from_str(&env, "Test Artwork"),
        &String::from_str(&env, "A test artwork"),
        &Symbol::new(&env, "StableDiffusion"),
        &test_content_hash(&env, 1),
        &500,
        &true,
        &60,
        &40,
        &true,
    );

    // Advance time past evolution interval
    env.ledger().set_timestamp(env.ledger().timestamp() + 86401);

    let prompt = String::from_str(&env, "Make it more colorful");
    let new_ipfs_hash = String::from_str(&env, "QmEvolved123");
    let new_content_hash = test_content_hash(&env, 2);
    let payment_token = Address::generate(&env);

    client.evolve_artwork(
        &creator,
        &token_id,
        &prompt,
        &new_ipfs_hash,
        &new_content_hash,
        &payment_token,
    );

    let evolutions = client.get_evolutions(&token_id);
    assert_eq!(evolutions.len(), 1);

    let artwork = client.get_artwork(&token_id);
    assert_eq!(artwork.evolution_count, 1);
}

#[test]
fn test_cancel_listing() {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let creator = Address::generate(&env);
    let treasury = Address::generate(&env);

    let contract_id = env.register_contract(None, WutaWutaMarketplace);
    let client = WutaWutaMarketplaceClient::new(&env, &contract_id);

    client.initialize(&admin, &250, &treasury, &1000000, &86400);

    let token_id = client.mint_artwork(
        &creator,
        &String::from_str(&env, "QmTest123"),
        &String::from_str(&env, "Test Artwork"),
        &String::from_str(&env, "A test artwork"),
        &Symbol::new(&env, "StableDiffusion"),
        &test_content_hash(&env, 1),
        &500,
        &true,
        &60,
        &40,
        &true,
    );

    client.list_artwork(&creator, &token_id, &1000000, &86400, &false, &None);

    client.cancel_listing(&creator, &token_id);

    let listing = client.get_listing(&token_id);
    assert_eq!(listing.status, ListingStatus::Cancelled);
}

#[test]
fn test_admin_functions() {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let treasury = Address::generate(&env);
    let new_treasury = Address::generate(&env);

    let contract_id = env.register_contract(None, WutaWutaMarketplace);
    let client = WutaWutaMarketplaceClient::new(&env, &contract_id);

    client.initialize(&admin, &250, &treasury, &1000000, &86400);

    client.update_marketplace_fee(&300);
    client.update_evolution_fee(&2000000);
    client.update_treasury(&new_treasury);

    // Verify events were emitted (init + 3 updates)
    let events = env.events().all();
    assert!(events.len() >= 4);
}

#[test]
#[should_panic(expected = "Royalty too high")]
fn test_mint_with_high_royalty() {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let creator = Address::generate(&env);
    let treasury = Address::generate(&env);

    let contract_id = env.register_contract(None, WutaWutaMarketplace);
    let client = WutaWutaMarketplaceClient::new(&env, &contract_id);

    client.initialize(&admin, &250, &treasury, &1000000, &86400);

    client.mint_artwork(
        &creator,
        &String::from_str(&env, "QmTest123"),
        &String::from_str(&env, "Test Artwork"),
        &String::from_str(&env, "A test artwork"),
        &Symbol::new(&env, "StableDiffusion"),
        &test_content_hash(&env, 1),
        &1500, // 15% — should fail
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
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let creator = Address::generate(&env);
    let treasury = Address::generate(&env);

    let contract_id = env.register_contract(None, WutaWutaMarketplace);
    let client = WutaWutaMarketplaceClient::new(&env, &contract_id);

    client.initialize(&admin, &250, &treasury, &1000000, &86400);

    let token_id = client.mint_artwork(
        &creator,
        &String::from_str(&env, "QmTest123"),
        &String::from_str(&env, "Test Artwork"),
        &String::from_str(&env, "A test artwork"),
        &Symbol::new(&env, "StableDiffusion"),
        &test_content_hash(&env, 1),
        &500,
        &true,
        &60,
        &40,
        &true,
    );

    client.list_artwork(&creator, &token_id, &1000000, &86400, &false, &None);
    client.list_artwork(&creator, &token_id, &2000000, &86400, &false, &None);
}

#[test]
#[should_panic(expected = "Not the token owner")]
fn test_unauthorized_listing() {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let creator = Address::generate(&env);
    let unauthorized = Address::generate(&env);
    let treasury = Address::generate(&env);

    let contract_id = env.register_contract(None, WutaWutaMarketplace);
    let client = WutaWutaMarketplaceClient::new(&env, &contract_id);

    client.initialize(&admin, &250, &treasury, &1000000, &86400);

    let token_id = client.mint_artwork(
        &creator,
        &String::from_str(&env, "QmTest123"),
        &String::from_str(&env, "Test Artwork"),
        &String::from_str(&env, "A test artwork"),
        &Symbol::new(&env, "StableDiffusion"),
        &test_content_hash(&env, 1),
        &500,
        &true,
        &60,
        &40,
        &true,
    );

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

    let contract_id = env.register_contract(None, WutaWutaMarketplace);
    let client = WutaWutaMarketplaceClient::new(&env, &contract_id);

    client.initialize(&admin, &250, &treasury, &1000000, &86400);

    let token_id = client.mint_artwork(
        &creator,
        &String::from_str(&env, "QmTest123"),
        &String::from_str(&env, "Test Artwork"),
        &String::from_str(&env, "A test artwork"),
        &Symbol::new(&env, "StableDiffusion"),
        &test_content_hash(&env, 1),
        &500,
        &true,
        &60,
        &40,
        &true,
    );

    let offer_amount = 2000000i128;
    let duration = 3600u64;

    let offer_id = client.make_offer(&buyer, &token_id, &offer_amount, &duration, &payment_token);
    assert_eq!(offer_id, 1);

    let offers = client.get_offers(&token_id);
    assert_eq!(offers.len(), 1);
    let offer = offers.get(0).unwrap();
    assert_eq!(offer.id, offer_id);
    assert_eq!(offer.buyer, buyer);
    assert_eq!(offer.amount, offer_amount);
    assert_eq!(offer.active, true);

    client.accept_offer(&creator, &token_id, &offer_id);

    let new_owner = client.get_token_owner(&token_id);
    assert_eq!(new_owner, buyer);

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

    let contract_id = env.register_contract(None, WutaWutaMarketplace);
    let client = WutaWutaMarketplaceClient::new(&env, &contract_id);

    client.initialize(&admin, &250, &treasury, &1000000, &86400);

    let token_id = client.mint_artwork(
        &creator,
        &String::from_str(&env, "QmTest123"),
        &String::from_str(&env, "Test Artwork"),
        &String::from_str(&env, "A test artwork"),
        &Symbol::new(&env, "StableDiffusion"),
        &test_content_hash(&env, 1),
        &500,
        &true,
        &60,
        &40,
        &true,
    );

    let offer_id = client.make_offer(&buyer, &token_id, &1000000, &3600, &payment_token);

    client.cancel_offer(&buyer, &token_id, &offer_id);

    let offers = client.get_offers(&token_id);
    assert_eq!(offers.get(0).unwrap().active, false);
}
