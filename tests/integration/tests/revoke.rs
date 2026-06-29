use meridian_integration_tests::*;
use odra::casper_types::U256;

/// Revoke flow requires compliance-officer timelock (24h on livenet) — covered in unit tests.
/// This livenet test confirms the deployed token is readable for the compliant deployer.
#[test]
fn compliant_holder_balance_on_testnet() {
    let env = livenet_env();
    let deployer = env.caller();
    let (_registry, token, _vault, _distributor, _audit) = load_deployed_stack(&env);

    let bal = retry_read("token_balance", 5, 1500, || token.balance_of(&deployer));
    assert!(bal > U256::zero());
    println!("compliant_balance_ok={bal}");
}
