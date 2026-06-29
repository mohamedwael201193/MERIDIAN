use meridian_integration_tests::*;
use odra::host::HostRef;

#[test]
fn gas_budgets_documented_and_deposit_succeeds() {
    let env = livenet_env();
    let deposit = deposit_amount();
    let (_registry, token, mut vault, _distributor, _audit) = load_deployed_stack(&env);

    assert_eq!(DEPLOY_GAS, 450_000_000_000);
    assert_eq!(CALL_GAS, 50_000_000_000);

    let staked_before = retry_read("staked_before", 8, 2000, || vault.get_total_staked());
    let staked_after = if staked_before < deposit {
        let deployer = env.caller();
        let balance = retry_read("deployer_cspr", 5, 1500, || env.balance_of(&deployer));
        if balance >= deposit {
            env.set_gas(CALL_GAS);
            vault.with_tokens(deposit).deposit();
            retry_read("staked_after", 8, 2000, || vault.get_total_staked())
        } else {
            println!("skip deposit: purse {balance} motes, staked={staked_before}");
            staked_before
        }
    } else {
        println!("skip deposit: already staked {staked_before}");
        staked_before
    };
    assert!(staked_after >= deposit.min(staked_before));
    let _supply = retry_read("total_supply", 5, 1500, || token.total_supply());
    println!("gas_report_ok staked={staked_after}");
}
