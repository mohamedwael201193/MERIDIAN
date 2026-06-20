//! Shared helpers for MERIDIAN livenet integration tests and smoke binaries.

use meridian_contracts::compliance_registry::{ComplianceRegistry, ComplianceRegistryInitArgs};
use meridian_contracts::meridian_audit::MeridianAudit;
use meridian_contracts::meridian_token::{MeridianToken, MeridianTokenInitArgs};
use meridian_contracts::staking_vault::{StakingVault, StakingVaultInitArgs};
use meridian_contracts::yield_distributor::{YieldDistributor, YieldDistributorInitArgs};
use meridian_types::{AssetMetadata, Attestation, ComplianceRules, TIMELOCK_DURATION_MS};
use odra::casper_types::{U256, U512};
use odra::host::{Deployer, HostEnv, HostRef, NoArgs};
use odra::prelude::*;
use odra::OdraContract;

mod validator;
use super::validator::testnet_validator;

pub const DEPLOY_GAS: u64 = 450_000_000_000;
pub const CALL_GAS: u64 = 50_000_000_000;

pub type RegistryRef = <ComplianceRegistry as OdraContract>::HostRef;
pub type TokenRef = <MeridianToken as OdraContract>::HostRef;
pub type VaultRef = <StakingVault as OdraContract>::HostRef;
pub type DistributorRef = <YieldDistributor as OdraContract>::HostRef;
pub type AuditRef = <MeridianAudit as OdraContract>::HostRef;

pub fn sample_attestation(env: &HostEnv) -> Attestation {
    Attestation {
        country: 840,
        accredited: true,
        expires_at: env.block_time() + TIMELOCK_DURATION_MS * 365,
        sanctions_cleared: true,
    }
}

/// Deploy the full MERIDIAN contract stack on livenet.
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

/// Minimum CSPR deposit for vault smoke tests (2.5 CSPR).
pub fn smoke_deposit_amount() -> U512 {
    U512::from(500_000_000_000u64)
}
