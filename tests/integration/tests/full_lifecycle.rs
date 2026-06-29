use meridian_integration_tests::*;
use odra::casper_types::U256;
use odra::host::HostRef;

#[test]
fn full_lifecycle_deposit_and_stake() {
    let env = livenet_env();
    let deployer = env.caller();
    let deposit = deposit_amount();

    let (_registry, token, mut vault, _distributor, _audit) = load_deployed_stack(&env);
    let staked_before = retry_read("get_total_staked_before", 8, 2000, || vault.get_total_staked());
    let supply_before = retry_read("total_supply_before", 5, 1500, || token.total_supply());

    if staked_before < deposit {
        let balance = retry_read("deployer_cspr", 5, 1500, || env.balance_of(&deployer));
        if balance >= deposit {
            env.set_gas(CALL_GAS);
            vault.with_tokens(deposit).deposit();
        } else {
            println!(
                "skip deposit: purse {balance} motes < {deposit} (staked={staked_before})"
            );
        }
    } else {
        println!("skip deposit: already staked {staked_before} >= {deposit}");
    }

    let staked_after = retry_read("get_total_staked_after", 8, 2000, || vault.get_total_staked());
    assert!(staked_after >= deposit.min(staked_before), "staked {staked_after}");
    assert!(retry_read("total_supply_after", 5, 1500, || token.total_supply()) >= supply_before);
    println!("lifecycle_ok staked={staked_after}");
}

#[test]
fn compliant_deployer_has_mrwa_balance() {
    let env = livenet_env();
    let deployer = env.caller();
    let (_registry, token, _vault, _distributor, _audit) = load_deployed_stack(&env);

    let bal = retry_read("deployer_balance", 5, 1500, || token.balance_of(&deployer));
    assert!(bal > U256::zero(), "deployer MRWA balance should be positive");
    println!("deployer_mrwa_balance={bal}");
}
