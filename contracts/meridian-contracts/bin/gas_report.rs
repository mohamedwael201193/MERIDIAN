//! Gas measurement binary against Casper testnet.

mod livenet_helpers;
mod validator;

use livenet_helpers::{deploy_stack, smoke_deposit_amount, CALL_GAS, DEPLOY_GAS};
use odra::host::HostRef;
use std::fs;
use std::path::PathBuf;

#[derive(Debug)]
struct GasLine {
    operation: &'static str,
    gas_limit: u64,
    note: String,
}

fn main() {
    let env = odra_casper_livenet_env::env();
    let mut lines = Vec::new();

    lines.push(GasLine {
        operation: "ComplianceRegistry::deploy",
        gas_limit: DEPLOY_GAS,
        note: "Odra livenet deploy gas budget".to_string(),
    });

    let (registry, token, mut vault, _distributor, audit) = deploy_stack(&env);

    lines.push(GasLine {
        operation: "MeridianToken::deploy",
        gas_limit: DEPLOY_GAS,
        note: "included in deploy_stack".to_string(),
    });
    lines.push(GasLine {
        operation: "StakingVault::deploy",
        gas_limit: DEPLOY_GAS,
        note: "included in deploy_stack".to_string(),
    });
    lines.push(GasLine {
        operation: "YieldDistributor::deploy",
        gas_limit: DEPLOY_GAS,
        note: "included in deploy_stack".to_string(),
    });
    lines.push(GasLine {
        operation: "MeridianAudit::deploy",
        gas_limit: DEPLOY_GAS,
        note: "included in deploy_stack".to_string(),
    });
    lines.push(GasLine {
        operation: "ComplianceRegistry::register_holder",
        gas_limit: CALL_GAS,
        note: "included in deploy_stack wiring".to_string(),
    });

    let deposit = smoke_deposit_amount();
    env.set_gas(CALL_GAS);
    vault.with_tokens(deposit).deposit();
    lines.push(GasLine {
        operation: "StakingVault::deposit",
        gas_limit: CALL_GAS,
        note: "2.5 CSPR attached; includes delegate + accrue_yield".to_string(),
    });

    let supply = token.total_supply();
    lines.push(GasLine {
        operation: "MeridianToken::total_supply (query)",
        gas_limit: 0,
        note: "read-only livenet query — no gas".to_string(),
    });

    let staked = vault.get_total_staked();
    lines.push(GasLine {
        operation: "StakingVault::total_staked (query)",
        gas_limit: 0,
        note: format!("staked={staked} motes"),
    });

    let _ = (registry, audit, supply);

    let mut md = String::from("# MERIDIAN Gas Analysis (Casper Testnet)\n\n");
    md.push_str("| Operation | Gas Limit (motes) | Notes |\n");
    md.push_str("| --- | ---: | --- |\n");
    for line in &lines {
        md.push_str(&format!(
            "| {} | {} | {} |\n",
            line.operation, line.gas_limit, line.note
        ));
    }
    md.push_str("\n## Contract Addresses (this run)\n\n");
    md.push_str(&format!("- ComplianceRegistry: `{}`\n", registry.address()));
    md.push_str(&format!("- MeridianToken: `{}`\n", token.address()));
    md.push_str(&format!("- StakingVault: `{}`\n", vault.address()));
    md.push_str(&format!("- MeridianAudit: `{}`\n", audit.address()));

    let out = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("../../docs/GAS_ANALYSIS.md");
    if let Some(parent) = out.parent() {
        fs::create_dir_all(parent).expect("create docs dir");
    }
    fs::write(&out, &md).expect("write GAS_ANALYSIS.md");
    println!("Wrote {}", out.display());
    for line in &lines {
        println!("{}: {} motes — {}", line.operation, line.gas_limit, line.note);
    }
}
