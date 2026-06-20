//! MERIDIAN testnet deploy script for Odra CLI.

use meridian_contracts::compliance_registry::{ComplianceRegistry, ComplianceRegistryInitArgs};
use meridian_contracts::meridian_audit::MeridianAudit;
use meridian_contracts::meridian_token::{MeridianToken, MeridianTokenInitArgs};
use meridian_contracts::staking_vault::{StakingVault, StakingVaultInitArgs};
use meridian_contracts::yield_distributor::{YieldDistributor, YieldDistributorInitArgs};
use meridian_types::{AssetMetadata, Attestation, ComplianceRules, TIMELOCK_DURATION_MS};
use odra::casper_types::U256;
use odra::host::{HostEnv, HostRef, NoArgs};
use odra_cli::deploy::{DeployScript, Error as DeployError};
use odra_cli::{DeployerExt, DeployedContractsContainer};

use super::validator::testnet_validator;

/// Maximum gas budget per contract deployment (motes) — 450 CSPR ceiling per tx.
pub const DEPLOY_GAS: u64 = 450_000_000_000;

/// Gas budget for wiring and smoke calls (motes) — delegate/deposit needs >5 CSPR on testnet.
pub const CALL_GAS: u64 = 50_000_000_000;

pub struct MeridianDeployScript;

impl DeployScript for MeridianDeployScript {
    fn deploy(
        &self,
        env: &HostEnv,
        container: &mut DeployedContractsContainer,
    ) -> Result<(), DeployError> {
        let deployer = env.caller();
        let validator = testnet_validator();

        let mut registry = ComplianceRegistry::load_or_deploy(
            env,
            ComplianceRegistryInitArgs {
                rules: ComplianceRules::default_permissive(),
            },
            container,
            DEPLOY_GAS,
        )?;

        let mut token = MeridianToken::load_or_deploy(
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
            container,
            DEPLOY_GAS,
        )?;

        env.set_gas(CALL_GAS);
        registry.set_token_address(token.contract_address());

        let mut vault = StakingVault::load_or_deploy(
            env,
            StakingVaultInitArgs {
                token: token.contract_address(),
                validator: validator.clone(),
            },
            container,
            DEPLOY_GAS,
        )?;

        let distributor = YieldDistributor::load_or_deploy(
            env,
            YieldDistributorInitArgs {
                token: token.contract_address(),
                vault: vault.contract_address(),
                treasury: deployer,
                compliance_registry: registry.contract_address(),
            },
            container,
            DEPLOY_GAS,
        )?;

        env.set_gas(CALL_GAS);
        vault.set_yield_distributor(distributor.contract_address());
        token.set_staking_vault(vault.contract_address());

        let attestation = Attestation {
            country: 840,
            accredited: true,
            expires_at: env.block_time() + TIMELOCK_DURATION_MS * 365,
            sanctions_cleared: true,
        };
        registry.register_holder(deployer, attestation);

        MeridianAudit::load_or_deploy(env, NoArgs, container, DEPLOY_GAS)?;

        env.set_gas(0);
        Ok(())
    }
}
