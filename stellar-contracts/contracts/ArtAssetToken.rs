use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, Symbol, String, Vec, Map};
use soroban_sdk::client::Client as _; // For client invocation

mod wutawuta_marketplace;
use wutawuta_marketplace::{WutaWutaMarketplaceClient, ArtAsset};

#[contract]
pub struct ArtAssetToken;

#[contractimpl]
impl ArtAssetToken {
    pub fn initialize(env: Env, admin: Address, marketplace_contract_id: Address) {
        env.storage().instance().set(&Symbol::new(&env, "admin"), &admin);
        env.storage().instance().set(&Symbol::new(&env, "marketplace"), &marketplace_contract_id);
    }

    /// Mints art asset by delegating to WutaWutaMarketplace.mint_artwork
    pub fn mint(
        env: Env,
        caller: Address,
        marketplace_id: Address,
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
        caller.require_auth();

        let marketplace_client = WutaWutaMarketplaceClient::new(&env, &marketplace_id);

        let token_id = marketplace_client.mint_artwork(
            &caller,
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

        // Emit NFT mint event
        env.events().publish(
            (Symbol::new(&env, "nft_minted"), caller.clone(), token_id),
            ipfs_hash.clone(),
        );

        token_id
    }

    pub fn get_art_asset(env: Env, marketplace_id: Address, token_id: u64) -> ArtAsset {
        let marketplace_client = WutaWutaMarketplaceClient::new(&env, &marketplace_id);
        marketplace_client.get_art_asset(&token_id)
    }

    pub fn total_supply(env: Env) -> u64 {
        // Delegate to marketplace or track separately if needed
        // For now, assume marketplace handles supply
        0u64
    }

    pub fn set_admin(env: Env, new_admin: Address) {
        let admin: Address = env.storage().instance().get(&Symbol::new(&env, "admin")).unwrap();
        admin.require_auth();
        env.storage().instance().set(&Symbol::new(&env, "admin"), &new_admin);
    }

    pub fn get_marketplace_id(env: Env) -> Address {
        env.storage().instance().get(&Symbol::new(&env, "marketplace")).unwrap_or(Address::generate(&env))
    }
}

