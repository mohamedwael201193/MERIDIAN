use meridian_integration_tests::*;
use odra::casper_types::U512;

#[test]
#[should_panic]
fn restake_requires_curator_role() {
    let env = livenet_env();
    let (_registry, _token, mut vault, _distributor, _audit) = load_deployed_stack(&env);
    let validator = meridian_integration_tests::testnet_validator();

    env.set_gas(CALL_GAS);
    vault.restake(validator.clone(), validator, U512::from(1_000u64));
}
