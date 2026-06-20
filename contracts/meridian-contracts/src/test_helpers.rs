#![cfg(test)]

use crate::compliance_registry::{ComplianceRegistry, ComplianceRegistryInitArgs};
use crate::meridian_audit::MeridianAudit;
use crate::meridian_token::{MeridianToken, MeridianTokenInitArgs};
use crate::staking_vault::{StakingVault, StakingVaultInitArgs};
use crate::yield_distributor::{YieldDistributor, YieldDistributorInitArgs};
use meridian_types::{AssetMetadata, Attestation, ComplianceRules, TIMELOCK_DURATION_MS};
use odra::casper_types::{U256, U512};
use odra::host::{Deployer, HostEnv, HostRef, NoArgs};
use odra::prelude::Address;
use odra::OdraContract;

type RegistryRef = <ComplianceRegistry as OdraContract>::HostRef;
type TokenRef = <MeridianToken as OdraContract>::HostRef;
type VaultRef = <StakingVault as OdraContract>::HostRef;
type DistributorRef = <YieldDistributor as OdraContract>::HostRef;
type AuditRef = <MeridianAudit as OdraContract>::HostRef;

pub fn deploy_registry(env: &HostEnv) -> RegistryRef {
    let deployer = env.get_account(0);
    env.set_caller(deployer);
    ComplianceRegistry::deploy(
        &env,
        ComplianceRegistryInitArgs {
            rules: ComplianceRules::default_permissive(),
        },
    )
}

pub fn deploy_registry_with_rules(env: &HostEnv, rules: ComplianceRules) -> RegistryRef {
    let deployer = env.get_account(0);
    env.set_caller(deployer);
    ComplianceRegistry::deploy(&env, ComplianceRegistryInitArgs { rules })
}

pub fn deploy_token(env: &HostEnv, registry: Address, initial_supply: U256) -> TokenRef {
    let deployer = env.get_account(0);
    env.set_caller(deployer);
    MeridianToken::deploy(
        &env,
        MeridianTokenInitArgs {
            metadata: AssetMetadata {
                name: "MRWA".to_string(),
                symbol: "MRWA".to_string(),
                decimals: 9,
            },
            initial_supply,
            compliance_registry: registry,
        },
    )
}

pub fn sample_attestation(env: &HostEnv) -> Attestation {
    Attestation {
        country: 840,
        accredited: true,
        expires_at: env.block_time() + TIMELOCK_DURATION_MS * 365,
        sanctions_cleared: true,
    }
}

pub fn deploy_audit(env: &HostEnv) -> AuditRef {
    let deployer = env.get_account(0);
    env.set_caller(deployer);
    MeridianAudit::deploy(&env, NoArgs)
}

pub fn deploy_stack(env: &HostEnv) -> (RegistryRef, TokenRef, VaultRef, DistributorRef) {
    let deployer = env.get_account(0);
    env.set_caller(deployer);
    let mut registry = ComplianceRegistry::deploy(
        &env,
        ComplianceRegistryInitArgs {
            rules: ComplianceRules::default_permissive(),
        },
    );
    let mut token = MeridianToken::deploy(
        &env,
        MeridianTokenInitArgs {
            metadata: AssetMetadata {
                name: "MRWA".to_string(),
                symbol: "MRWA".to_string(),
                decimals: 9,
            },
            initial_supply: U256::zero(),
            compliance_registry: registry.contract_address(),
        },
    );
    registry.set_token_address(token.contract_address());
    let validator = env.get_validator(0);
    let mut vault = StakingVault::deploy(
        &env,
        StakingVaultInitArgs {
            token: token.contract_address(),
            validator,
        },
    );
    let distributor = YieldDistributor::deploy(
        &env,
        YieldDistributorInitArgs {
            token: token.contract_address(),
            vault: vault.contract_address(),
            treasury: env.get_account(9),
            compliance_registry: registry.contract_address(),
        },
    );
    vault.set_yield_distributor(distributor.contract_address());
    token.set_staking_vault(vault.contract_address());
    (registry, token, vault, distributor)
}

pub fn deploy_vault_stack(env: &HostEnv) -> (TokenRef, VaultRef, DistributorRef) {
    let (_, token, vault, distributor) = deploy_stack(env);
    (token, vault, distributor)
}

pub fn deploy_stack_with_deposit(
    env: &HostEnv,
) -> (RegistryRef, TokenRef, VaultRef, DistributorRef) {
    let (mut registry, token, vault, distributor) = deploy_stack(env);
    let holder = env.get_account(1);
    registry.register_holder(holder, sample_attestation(env));
    env.set_caller(holder);
    vault.with_tokens(U512::from(1_000u64)).deposit();
    (registry, token, vault, distributor)
}

pub fn deploy_token_system(env: &HostEnv) -> (RegistryRef, TokenRef) {
    let deployer = env.get_account(0);
    let mut registry = deploy_registry(env);
    registry.register_holder(deployer, sample_attestation(env));
    let token = deploy_token(env, registry.contract_address(), U256::from(1_000_000u64));
    registry.set_token_address(token.contract_address());
    (registry, token)
}
