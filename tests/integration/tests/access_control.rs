use meridian_integration_tests::*;

#[test]
#[should_panic]
fn duplicate_holder_registration_reverts() {
    let env = livenet_env();
    let deployer = env.caller();
    let (mut registry, _token, _vault, _distributor, _audit) = load_deployed_stack(&env);

    env.set_gas(CALL_GAS);
    registry.register_holder(deployer, sample_attestation(&env));
}
