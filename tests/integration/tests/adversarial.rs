use meridian_integration_tests::*;
use odra::casper_types::U512;

#[test]
#[should_panic]
fn adversarial_distribute_from_non_vault_reverts() {
    let env = livenet_env();
    let (_registry, _token, _vault, mut distributor, _audit) = load_deployed_stack(&env);

    env.set_gas(CALL_GAS);
    distributor.distribute(U512::from(1_000u64));
}
