//! CLI entry point for MERIDIAN contract deployment and testnet interaction.

mod deploy_script;
mod validator;

use deploy_script::MeridianDeployScript;
use meridian_contracts::compliance_registry::ComplianceRegistry;
use meridian_contracts::meridian_audit::MeridianAudit;
use meridian_contracts::meridian_token::MeridianToken;
use meridian_contracts::staking_vault::StakingVault;
use meridian_contracts::yield_distributor::YieldDistributor;
use odra_cli::OdraCli;

pub fn main() {
    OdraCli::new()
        .about("CLI tool for MERIDIAN smart contracts")
        .contracts_file("../deployed/casper-test-contracts.toml")
        .contract::<ComplianceRegistry>()
        .contract::<MeridianToken>()
        .contract::<StakingVault>()
        .contract::<YieldDistributor>()
        .contract::<MeridianAudit>()
        .deploy(MeridianDeployScript)
        .build()
        .run();
}
