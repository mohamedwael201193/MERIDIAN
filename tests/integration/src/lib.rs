//! Shared livenet helpers for MERIDIAN integration tests.

use meridian_contracts::compliance_registry::{ComplianceRegistry, ComplianceRegistryInitArgs};
use meridian_contracts::meridian_audit::MeridianAudit;
use meridian_contracts::meridian_token::{MeridianToken, MeridianTokenInitArgs};
use meridian_contracts::staking_vault::{StakingVault, StakingVaultInitArgs};
use meridian_contracts::yield_distributor::{YieldDistributor, YieldDistributorInitArgs};
use meridian_types::{AssetMetadata, Attestation, ComplianceRules, TIMELOCK_DURATION_MS};
use odra::casper_types::{AsymmetricType, PublicKey, U256, U512};
use odra::host::{Deployer, HostEnv, HostRef, HostRefLoader, NoArgs};
use odra::prelude::*;
use odra::OdraContract;

pub use odra::host::HostRef as LivenetHostRef;
pub use odra::prelude::Addressable;

const DEFAULT_TESTNET_VALIDATOR: &str =
    "010615d378f2a3c98b34707722413a43ce72dbbfcc6e6e05a19661bcb8ee67bc40";

pub const DEPLOY_GAS: u64 = 450_000_000_000;
pub const CALL_GAS: u64 = 50_000_000_000;

pub type RegistryRef = <ComplianceRegistry as OdraContract>::HostRef;
pub type TokenRef = <MeridianToken as OdraContract>::HostRef;
pub type VaultRef = <StakingVault as OdraContract>::HostRef;
pub type DistributorRef = <YieldDistributor as OdraContract>::HostRef;

pub fn testnet_validator() -> PublicKey {
    let hex = std::env::var("MERIDIAN_VALIDATOR_PUBLIC_KEY")
        .unwrap_or_else(|_| DEFAULT_TESTNET_VALIDATOR.to_string());
    PublicKey::from_hex(&hex).expect("MERIDIAN_VALIDATOR_PUBLIC_KEY must be valid hex")
}

use std::thread;
use std::time::Duration;

pub fn livenet_env() -> HostEnv {
    let env = odra_casper_livenet_env::env();
    // Odra livenet cannot read CEP-88 native events yet; skip post-call event sync.
    env.set_captures_events(false);
    env
}

/// Retry a read that may fail while testnet state is catching up.
pub fn retry_read<T, F: Fn() -> T>(label: &str, attempts: u32, delay_ms: u64, f: F) -> T {
    let mut last: Option<String> = None;
    for attempt in 1..=attempts {
        match std::panic::catch_unwind(std::panic::AssertUnwindSafe(&f)) {
            Ok(value) => return value,
            Err(payload) => {
                last = Some(format!("{payload:?}"));
                if attempt < attempts {
                    eprintln!("retry_read {label} attempt {attempt}/{attempts} failed, waiting {delay_ms}ms");
                    thread::sleep(Duration::from_millis(delay_ms));
                }
            }
        }
    }
    panic!("retry_read {label} failed after {attempts} attempts: {}", last.unwrap_or_default());
}

pub fn sample_attestation(env: &HostEnv) -> Attestation {
    Attestation {
        country: 840,
        accredited: true,
        expires_at: env.block_time() + TIMELOCK_DURATION_MS * 365,
        sanctions_cleared: true,
    }
}

pub type AuditRef = <MeridianAudit as OdraContract>::HostRef;

pub fn deploy_stack(env: &HostEnv) -> (RegistryRef, TokenRef, VaultRef, DistributorRef, AuditRef) {
    let deployer = env.caller();
    let validator = testnet_validator();

    env.set_gas(DEPLOY_GAS);
    let mut registry = ComplianceRegistry::deploy(
        env,
        ComplianceRegistryInitArgs {
            rules: ComplianceRules::default_permissive(),
        },
    );

    let mut token = MeridianToken::deploy(
        env,
        MeridianTokenInitArgs {
            metadata: AssetMetadata {
                name: "Meridian RWA".to_string(),
                symbol: "MRWA".to_string(),
                decimals: 9,
            },
            initial_supply: U256::from(1_000_000_000u64),
            compliance_registry: registry.contract_address(),
        },
    );

    env.set_gas(CALL_GAS);
    registry.set_token_address(token.contract_address());

    let mut vault = StakingVault::deploy(
        env,
        StakingVaultInitArgs {
            token: token.contract_address(),
            validator: validator.clone(),
        },
    );

    let distributor = YieldDistributor::deploy(
        env,
        YieldDistributorInitArgs {
            token: token.contract_address(),
            vault: vault.contract_address(),
            treasury: deployer,
            compliance_registry: registry.contract_address(),
        },
    );

    env.set_gas(CALL_GAS);
    vault.set_yield_distributor(distributor.contract_address());
    token.set_staking_vault(vault.contract_address());
    registry.register_holder(deployer, sample_attestation(env));

    env.set_gas(DEPLOY_GAS);
    let audit = MeridianAudit::deploy(env, NoArgs);
    env.set_gas(0);

    (registry, token, vault, distributor, audit)
}

/// Minimum Casper testnet delegation (500 CSPR per chainspec `minimum_delegation_amount`).
pub fn deposit_amount() -> U512 {
    U512::from(500_000_000_000u64)
}

fn contracts_toml_path() -> std::path::PathBuf {
    std::env::var("MERIDIAN_DEPLOYED_CONTRACTS_TOML")
        .map(std::path::PathBuf::from)
        .unwrap_or_else(|_| {
            std::path::PathBuf::from(env!("CARGO_MANIFEST_DIR"))
                .join("../../deployed/casper-test-contracts.toml")
        })
}

fn package_hash_from_toml(name: &str) -> Address {
    let raw = std::fs::read_to_string(contracts_toml_path())
        .unwrap_or_else(|e| panic!("read deployed contracts toml: {e}"));
    for block in raw.split("[[contracts]]") {
        let block_name = block
            .lines()
            .find_map(|line| line.strip_prefix("name = ").map(|s| s.trim().trim_matches('"')));
        if block_name != Some(name) {
            continue;
        }
        let hash = block
            .lines()
            .find_map(|line| line.strip_prefix("package_hash = "))
            .map(|s| s.trim().trim_matches('"'))
            .unwrap_or_else(|| panic!("package_hash missing for {name}"));
        return Address::from_str(hash).unwrap_or_else(|e| panic!("invalid hash for {name}: {e:?}"));
    }
    panic!("contract {name} not found in deployed toml");
}

/// Load the Phase 4 testnet deployment (no redeploy — saves gas).
pub fn load_deployed_stack(
    env: &HostEnv,
) -> (RegistryRef, TokenRef, VaultRef, DistributorRef, AuditRef) {
    retry_read("load_deployed_stack", 5, 2000, || {
        let registry = ComplianceRegistry::load(env, package_hash_from_toml("ComplianceRegistry"));
        let token = MeridianToken::load(env, package_hash_from_toml("MeridianToken"));
        let vault = StakingVault::load(env, package_hash_from_toml("StakingVault"));
        let distributor =
            YieldDistributor::load(env, package_hash_from_toml("YieldDistributor"));
        let audit = MeridianAudit::load(env, package_hash_from_toml("MeridianAudit"));
        (registry, token, vault, distributor, audit)
    })
}
