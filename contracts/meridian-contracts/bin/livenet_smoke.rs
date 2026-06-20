//! Testnet smoke binary — deploy stack and execute deposit on real Casper testnet.

mod livenet_helpers;
mod validator;

use livenet_helpers::{deploy_stack, smoke_deposit_amount, CALL_GAS};
use odra::host::HostRef;

fn main() {
    let env = odra_casper_livenet_env::env();
    let deployer = env.caller();
    let balance = env.balance_of(&deployer);
    println!("Deployer: {deployer}");
    println!("Balance (motes): {balance}");

    let (registry, token, mut vault, distributor, audit) = deploy_stack(&env);
    println!("ComplianceRegistry: {}", registry.address());
    println!("MeridianToken: {}", token.address());
    println!("StakingVault: {}", vault.address());
    println!("YieldDistributor: {}", distributor.address());
    println!("MeridianAudit: {}", audit.address());

    let deposit = smoke_deposit_amount();
    if balance < deposit {
        eprintln!(
            "Insufficient balance for deposit smoke test (need {deposit}, have {balance})"
        );
        std::process::exit(2);
    }

    env.set_gas(CALL_GAS);
    vault.with_tokens(deposit).deposit();
    let staked = vault.get_total_staked();
    println!("Vault total_staked after deposit: {staked}");
    assert!(staked >= deposit);
    println!("SMOKE_OK");
}
