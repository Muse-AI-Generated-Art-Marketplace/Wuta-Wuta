// ============================================================================
// bridge_interface.rs — Cross-Chain Bridge Interface (Issue #43)
//
// Provides asset locking/releasing for cross-chain bridging between Stellar
// and EVM chains (Ethereum, Polygon). Assets are locked on the Stellar side
// with a deterministic lock_hash; the counterpart bridge contract on the
// target chain uses verify_lock to confirm the lock before minting/releasing.
//
// Storage design follows the same optimized patterns from Issue #42:
// - DataKey enum for all keys
// - instance() for global config (admin)
// - persistent() for per-lock and per-owner data with TTL management
// ============================================================================

use soroban_sdk::{
    contract, contractimpl, contracttype, Address, BytesN, Env, Symbol, Vec,
};

// ---------------------------------------------------------------------------
// TTL constants (same as marketplace)
// ---------------------------------------------------------------------------
const LIFETIME_THRESHOLD: u32 = 17_280;   // ~1 day
const BUMP_AMOUNT: u32 = 518_400;          // ~30 days

// ---------------------------------------------------------------------------
// Supported target chains — compact enum, 1 byte on-chain.
// ---------------------------------------------------------------------------
#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
#[repr(u32)]
pub enum TargetChain {
    Ethereum = 0,
    Polygon = 1,
}

// ---------------------------------------------------------------------------
// Lock status — compact enum instead of bool flags.
// ---------------------------------------------------------------------------
#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
#[repr(u32)]
pub enum LockStatus {
    Locked = 0,
    Released = 1,
}

// ---------------------------------------------------------------------------
// BridgeAsset — represents a locked asset awaiting cross-chain transfer.
// ---------------------------------------------------------------------------
#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub struct BridgeAsset {
    pub asset_id: u64,
    pub owner: Address,
    pub source_chain: Symbol,       // always "stellar" for this contract
    pub target_chain: TargetChain,
    pub amount: i128,
    pub lock_hash: BytesN<32>,
    pub lock_timestamp: u64,
    pub status: LockStatus,
}

// ---------------------------------------------------------------------------
// Storage keys
// ---------------------------------------------------------------------------
#[derive(Clone)]
#[contracttype]
pub enum BridgeDataKey {
    Admin,
    LockCounter,
    Lock(BytesN<32>),           // lock_hash → BridgeAsset
    OwnerLocks(Address),        // owner → Vec<BytesN<32>> (list of lock_hashes)
}

// ---------------------------------------------------------------------------
// Contract
// ---------------------------------------------------------------------------

#[contract]
pub struct CrossChainBridge;

#[contractimpl]
impl CrossChainBridge {
    // -----------------------------------------------------------------------
    // Initialization
    // -----------------------------------------------------------------------

    /// Initialize the bridge with an admin address.
    pub fn initialize(env: Env, admin: Address) {
        env.storage().instance().set(&BridgeDataKey::Admin, &admin);
        env.storage().instance().set(&BridgeDataKey::LockCounter, &0u64);
        env.storage().instance().bump(LIFETIME_THRESHOLD, BUMP_AMOUNT);

        env.events().publish(
            (Symbol::new(&env, "bridge_initialized"),),
            admin,
        );
    }

    // -----------------------------------------------------------------------
    // lock_asset — locks an asset on the Stellar side for cross-chain bridging
    // -----------------------------------------------------------------------

    /// Lock an asset for cross-chain transfer.
    ///
    /// Generates a deterministic lock_hash from (owner, asset_id, amount, counter)
    /// using SHA-256. Emits an AssetLocked event with the lock_hash so the
    /// target-chain bridge can pick it up.
    ///
    /// Returns the lock_hash.
    pub fn lock_asset(
        env: Env,
        owner: Address,
        asset_id: u64,
        amount: i128,
        target_chain: TargetChain,
    ) -> BytesN<32> {
        owner.require_auth();

        if amount <= 0 { panic!("Amount must be positive"); }

        let counter = Self::increment_lock_counter(&env);

        // Compute deterministic lock_hash = SHA256(owner | asset_id | amount | counter)
        let mut preimage = soroban_sdk::Bytes::new(&env);
        // Encode fields into bytes for hashing
        preimage.append(&owner.to_string().into());
        preimage.append(&soroban_sdk::Bytes::from_array(&env, &asset_id.to_be_bytes()));
        preimage.append(&soroban_sdk::Bytes::from_array(&env, &amount.to_be_bytes()));
        preimage.append(&soroban_sdk::Bytes::from_array(&env, &counter.to_be_bytes()));

        let lock_hash: BytesN<32> = env.crypto().sha256(&preimage);

        let bridge_asset = BridgeAsset {
            asset_id,
            owner: owner.clone(),
            source_chain: Symbol::new(&env, "stellar"),
            target_chain: target_chain.clone(),
            amount,
            lock_hash: lock_hash.clone(),
            lock_timestamp: env.ledger().timestamp(),
            status: LockStatus::Locked,
        };

        // Store lock in persistent()
        env.storage().persistent().set(&BridgeDataKey::Lock(lock_hash.clone()), &bridge_asset);
        Self::bump_persistent(&env, &BridgeDataKey::Lock(lock_hash.clone()));

        // Add to owner's lock list
        let mut owner_locks: Vec<BytesN<32>> = env
            .storage()
            .persistent()
            .get(&BridgeDataKey::OwnerLocks(owner.clone()))
            .unwrap_or(Vec::new(&env));
        owner_locks.push_back(lock_hash.clone());
        env.storage().persistent().set(&BridgeDataKey::OwnerLocks(owner.clone()), &owner_locks);
        Self::bump_persistent(&env, &BridgeDataKey::OwnerLocks(owner.clone()));

        // Emit AssetLocked event
        env.events().publish(
            (Symbol::new(&env, "AssetLocked"),),
            (owner, asset_id, amount, target_chain, lock_hash.clone()),
        );

        lock_hash
    }

    // -----------------------------------------------------------------------
    // verify_lock — returns lock details for cross-chain verification
    // -----------------------------------------------------------------------

    /// Verify a lock by its hash. Returns the full BridgeAsset details.
    /// Used by off-chain relayers or target-chain contracts to confirm the lock.
    pub fn verify_lock(env: Env, lock_hash: BytesN<32>) -> BridgeAsset {
        let asset: BridgeAsset = env
            .storage()
            .persistent()
            .get(&BridgeDataKey::Lock(lock_hash.clone()))
            .expect("Lock not found");
        Self::bump_persistent(&env, &BridgeDataKey::Lock(lock_hash));
        asset
    }

    // -----------------------------------------------------------------------
    // release_asset — admin-only, releases a locked asset (for failed bridges)
    // -----------------------------------------------------------------------

    /// Release a previously locked asset back to its owner.
    /// Admin-only: intended for failed or disputed cross-chain transfers.
    pub fn release_asset(env: Env, admin: Address, lock_hash: BytesN<32>) {
        let stored_admin = Self::get_admin(&env);
        if admin != stored_admin { panic!("Unauthorized: admin only"); }
        admin.require_auth();

        let mut asset: BridgeAsset = env
            .storage()
            .persistent()
            .get(&BridgeDataKey::Lock(lock_hash.clone()))
            .expect("Lock not found");

        if asset.status != LockStatus::Locked {
            panic!("Asset not in locked state");
        }

        asset.status = LockStatus::Released;
        env.storage().persistent().set(&BridgeDataKey::Lock(lock_hash.clone()), &asset);
        Self::bump_persistent(&env, &BridgeDataKey::Lock(lock_hash.clone()));

        // Emit AssetReleased event
        env.events().publish(
            (Symbol::new(&env, "AssetReleased"),),
            (asset.owner, asset.asset_id, asset.amount, lock_hash),
        );
    }

    // -----------------------------------------------------------------------
    // get_locked_assets — list all locked assets for an owner
    // -----------------------------------------------------------------------

    /// Returns all BridgeAsset records for a given owner (both locked and released).
    pub fn get_locked_assets(env: Env, owner: Address) -> Vec<BridgeAsset> {
        let lock_hashes: Vec<BytesN<32>> = env
            .storage()
            .persistent()
            .get(&BridgeDataKey::OwnerLocks(owner.clone()))
            .unwrap_or(Vec::new(&env));

        let mut assets = Vec::new(&env);
        for hash in lock_hashes.iter() {
            if let Some(asset) = env
                .storage()
                .persistent()
                .get::<BridgeDataKey, BridgeAsset>(&BridgeDataKey::Lock(hash.clone()))
            {
                assets.push_back(asset);
            }
        }
        assets
    }

    // -----------------------------------------------------------------------
    // Admin
    // -----------------------------------------------------------------------

    /// Transfer admin role.
    pub fn set_admin(env: Env, new_admin: Address) {
        let admin = Self::get_admin(&env);
        admin.require_auth();
        env.storage().instance().set(&BridgeDataKey::Admin, &new_admin);
        env.storage().instance().bump(LIFETIME_THRESHOLD, BUMP_AMOUNT);
    }

    // -----------------------------------------------------------------------
    // Private helpers
    // -----------------------------------------------------------------------

    fn get_admin(env: &Env) -> Address {
        env.storage().instance().get(&BridgeDataKey::Admin).expect("Not initialized")
    }

    fn increment_lock_counter(env: &Env) -> u64 {
        let mut counter: u64 = env.storage().instance().get(&BridgeDataKey::LockCounter).unwrap_or(0);
        counter += 1;
        env.storage().instance().set(&BridgeDataKey::LockCounter, &counter);
        env.storage().instance().bump(LIFETIME_THRESHOLD, BUMP_AMOUNT);
        counter
    }

    fn bump_persistent(env: &Env, key: &BridgeDataKey) {
        env.storage().persistent().bump(key, LIFETIME_THRESHOLD, BUMP_AMOUNT);
    }
}

// ===========================================================================
// Tests
// ===========================================================================

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::testutils::Address as _;

    #[test]
    fn test_bridge_initialization() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);

        let contract_id = env.register_contract(None, CrossChainBridge);
        let client = CrossChainBridgeClient::new(&env, &contract_id);

        client.initialize(&admin);

        // Should emit bridge_initialized event
        assert!(env.events().all().len() >= 1);
    }

    #[test]
    fn test_lock_asset() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let owner = Address::generate(&env);

        let contract_id = env.register_contract(None, CrossChainBridge);
        let client = CrossChainBridgeClient::new(&env, &contract_id);

        client.initialize(&admin);

        let lock_hash = client.lock_asset(
            &owner,
            &1u64,          // asset_id
            &1000000i128,   // amount
            &TargetChain::Ethereum,
        );

        // Verify lock was created
        let asset = client.verify_lock(&lock_hash);
        assert_eq!(asset.asset_id, 1);
        assert_eq!(asset.owner, owner);
        assert_eq!(asset.amount, 1000000);
        assert_eq!(asset.target_chain, TargetChain::Ethereum);
        assert_eq!(asset.status, LockStatus::Locked);
    }

    #[test]
    fn test_lock_asset_polygon() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let owner = Address::generate(&env);

        let contract_id = env.register_contract(None, CrossChainBridge);
        let client = CrossChainBridgeClient::new(&env, &contract_id);

        client.initialize(&admin);

        let lock_hash = client.lock_asset(
            &owner,
            &42u64,
            &500000i128,
            &TargetChain::Polygon,
        );

        let asset = client.verify_lock(&lock_hash);
        assert_eq!(asset.target_chain, TargetChain::Polygon);
        assert_eq!(asset.asset_id, 42);
    }

    #[test]
    fn test_verify_lock() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let owner = Address::generate(&env);

        let contract_id = env.register_contract(None, CrossChainBridge);
        let client = CrossChainBridgeClient::new(&env, &contract_id);

        client.initialize(&admin);

        let lock_hash = client.lock_asset(
            &owner,
            &1u64,
            &1000000i128,
            &TargetChain::Ethereum,
        );

        // verify_lock should return matching details
        let asset = client.verify_lock(&lock_hash);
        assert_eq!(asset.lock_hash, lock_hash);
        assert_eq!(asset.owner, owner);
        assert_eq!(asset.status, LockStatus::Locked);
    }

    #[test]
    #[should_panic(expected = "Lock not found")]
    fn test_verify_nonexistent_lock() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);

        let contract_id = env.register_contract(None, CrossChainBridge);
        let client = CrossChainBridgeClient::new(&env, &contract_id);

        client.initialize(&admin);

        // Try to verify a lock that doesn't exist
        let fake_hash = BytesN::from_array(&env, &[0u8; 32]);
        client.verify_lock(&fake_hash);
    }

    #[test]
    fn test_release_asset() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let owner = Address::generate(&env);

        let contract_id = env.register_contract(None, CrossChainBridge);
        let client = CrossChainBridgeClient::new(&env, &contract_id);

        client.initialize(&admin);

        let lock_hash = client.lock_asset(
            &owner,
            &1u64,
            &1000000i128,
            &TargetChain::Ethereum,
        );

        // Admin releases the asset
        client.release_asset(&admin, &lock_hash);

        // Verify status changed
        let asset = client.verify_lock(&lock_hash);
        assert_eq!(asset.status, LockStatus::Released);
    }

    #[test]
    #[should_panic(expected = "Unauthorized: admin only")]
    fn test_release_unauthorized() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let owner = Address::generate(&env);
        let attacker = Address::generate(&env);

        let contract_id = env.register_contract(None, CrossChainBridge);
        let client = CrossChainBridgeClient::new(&env, &contract_id);

        client.initialize(&admin);

        let lock_hash = client.lock_asset(
            &owner,
            &1u64,
            &1000000i128,
            &TargetChain::Ethereum,
        );

        // Non-admin tries to release — should panic
        client.release_asset(&attacker, &lock_hash);
    }

    #[test]
    #[should_panic(expected = "Asset not in locked state")]
    fn test_double_release() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let owner = Address::generate(&env);

        let contract_id = env.register_contract(None, CrossChainBridge);
        let client = CrossChainBridgeClient::new(&env, &contract_id);

        client.initialize(&admin);

        let lock_hash = client.lock_asset(
            &owner,
            &1u64,
            &1000000i128,
            &TargetChain::Ethereum,
        );

        client.release_asset(&admin, &lock_hash);
        // Second release should fail
        client.release_asset(&admin, &lock_hash);
    }

    #[test]
    fn test_get_locked_assets() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let owner = Address::generate(&env);

        let contract_id = env.register_contract(None, CrossChainBridge);
        let client = CrossChainBridgeClient::new(&env, &contract_id);

        client.initialize(&admin);

        // Lock two assets
        client.lock_asset(&owner, &1u64, &1000000i128, &TargetChain::Ethereum);
        client.lock_asset(&owner, &2u64, &500000i128, &TargetChain::Polygon);

        let assets = client.get_locked_assets(&owner);
        assert_eq!(assets.len(), 2);
        assert_eq!(assets.get(0).unwrap().asset_id, 1);
        assert_eq!(assets.get(1).unwrap().asset_id, 2);
    }

    #[test]
    fn test_get_locked_assets_empty() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let owner = Address::generate(&env);

        let contract_id = env.register_contract(None, CrossChainBridge);
        let client = CrossChainBridgeClient::new(&env, &contract_id);

        client.initialize(&admin);

        let assets = client.get_locked_assets(&owner);
        assert_eq!(assets.len(), 0);
    }

    #[test]
    #[should_panic(expected = "Amount must be positive")]
    fn test_lock_zero_amount() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let owner = Address::generate(&env);

        let contract_id = env.register_contract(None, CrossChainBridge);
        let client = CrossChainBridgeClient::new(&env, &contract_id);

        client.initialize(&admin);

        client.lock_asset(&owner, &1u64, &0i128, &TargetChain::Ethereum);
    }

    #[test]
    fn test_multiple_owners_isolated() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let owner_a = Address::generate(&env);
        let owner_b = Address::generate(&env);

        let contract_id = env.register_contract(None, CrossChainBridge);
        let client = CrossChainBridgeClient::new(&env, &contract_id);

        client.initialize(&admin);

        client.lock_asset(&owner_a, &1u64, &1000000i128, &TargetChain::Ethereum);
        client.lock_asset(&owner_b, &2u64, &500000i128, &TargetChain::Polygon);

        let a_assets = client.get_locked_assets(&owner_a);
        let b_assets = client.get_locked_assets(&owner_b);

        assert_eq!(a_assets.len(), 1);
        assert_eq!(b_assets.len(), 1);
        assert_eq!(a_assets.get(0).unwrap().asset_id, 1);
        assert_eq!(b_assets.get(0).unwrap().asset_id, 2);
    }
}
