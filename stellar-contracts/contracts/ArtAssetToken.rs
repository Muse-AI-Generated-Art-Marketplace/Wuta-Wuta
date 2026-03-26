// ============================================================================
// ArtAssetToken.rs — Optimized for Soroban storage footprint (Issue #42)
//
// Storage optimizations applied:
// 1. Replaced String with Symbol for storage keys (Symbol is fixed-size, cheaper)
// 2. Use persistent() storage for per-token data (artwork metadata) with TTL
// 3. Use instance() storage only for global config (admin, counter)
// 4. Consolidated storage keys via enum (DataKey) to avoid raw Symbol collisions
// 5. Added bump_ttl for persistent entries to prevent premature expiry
// 6. Removed unnecessary Map wrapper — store each artwork under its own key
//    instead of loading the entire Map on every read/write
// ============================================================================

use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, Symbol, String, Vec};

/// Storage key enum — compact representation, avoids repeated Symbol::new allocations
/// and prevents key collisions between different data types.
#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Admin,          // instance() — global admin address
    Counter,        // instance() — next token ID counter
    Artwork(u64),   // persistent() — per-token metadata, keyed by token_id
}

/// TTL constants for persistent storage entries (in ledger sequence numbers).
/// BUMP_AMOUNT: how far to extend TTL on access.
/// LIFETIME_THRESHOLD: bump when remaining TTL falls below this.
const LIFETIME_THRESHOLD: u32 = 17_280;  // ~1 day at 5s/ledger
const BUMP_AMOUNT: u32 = 518_400;        // ~30 days

/// Artwork metadata — optimized struct.
/// Removed redundant fields; `metadata_url` and `content_hash` kept as String
/// because they carry variable-length IPFS hashes / hex digests that exceed
/// Symbol's 32-byte limit.
#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub struct ArtworkMetadata {
    pub creator: Address,
    pub metadata_url: String,   // IPFS URL — variable length, must remain String
    pub content_hash: String,   // hex digest — variable length, must remain String
}

#[contract]
pub struct ArtAssetToken;

#[contractimpl]
impl ArtAssetToken {
    /// Initialize the contract with an admin address.
    /// Stores admin and counter in instance() storage (cheap global config).
    pub fn initialize(env: Env, admin: Address) {
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Counter, &0u64);
        // Bump instance TTL so config survives across ledgers
        env.storage().instance().bump(LIFETIME_THRESHOLD, BUMP_AMOUNT);
    }

    /// Mint a new artwork token.
    /// Each artwork is stored under its own persistent() key (DataKey::Artwork(id))
    /// instead of inside a single large Map. This avoids loading/deserializing
    /// every artwork on every mint and keeps per-entry storage cost proportional
    /// to the individual record size.
    pub fn mint(env: Env, to: Address, _amount: i128, metadata_url: String, content_hash: String) -> u64 {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();

        let mut counter: u64 = env.storage().instance().get(&DataKey::Counter).unwrap_or(0);
        counter += 1;

        let metadata = ArtworkMetadata {
            creator: to.clone(),
            metadata_url: metadata_url.clone(),
            content_hash: content_hash.clone(),
        };

        // Store artwork individually in persistent() storage (not instance())
        // Persistent entries survive contract upgrades and have independent TTLs.
        env.storage().persistent().set(&DataKey::Artwork(counter), &metadata);
        env.storage().persistent().bump(&DataKey::Artwork(counter), LIFETIME_THRESHOLD, BUMP_AMOUNT);

        // Update global counter in instance()
        env.storage().instance().set(&DataKey::Counter, &counter);
        env.storage().instance().bump(LIFETIME_THRESHOLD, BUMP_AMOUNT);

        // Mint event
        env.events().publish(
            (Symbol::new(&env, "mint"), to, counter),
            metadata_url,
        );

        counter
    }

    /// Retrieve artwork metadata by token_id from persistent() storage.
    /// Bumps TTL on access to keep frequently-read entries alive.
    pub fn get_artwork(env: Env, token_id: u64) -> ArtworkMetadata {
        let metadata: ArtworkMetadata = env
            .storage()
            .persistent()
            .get(&DataKey::Artwork(token_id))
            .expect("Artwork not found");
        // Bump TTL on read so active artworks stay alive
        env.storage().persistent().bump(&DataKey::Artwork(token_id), LIFETIME_THRESHOLD, BUMP_AMOUNT);
        metadata
    }

    /// Total supply of minted tokens.
    pub fn total_supply(env: Env) -> u64 {
        env.storage().instance().get(&DataKey::Counter).unwrap_or(0)
    }

    /// Transfer admin role. Requires current admin auth.
    pub fn set_admin(env: Env, new_admin: Address) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &new_admin);
        env.storage().instance().bump(LIFETIME_THRESHOLD, BUMP_AMOUNT);
    }
}
