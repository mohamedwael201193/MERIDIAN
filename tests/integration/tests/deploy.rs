use meridian_integration_tests::*;

#[test]
fn verify_phase4_deployment_on_testnet() {
    let env = livenet_env();
    let (registry, token, vault, distributor, audit) = load_deployed_stack(&env);

    assert!(registry.address().to_string().starts_with("hash-"));
    assert!(token.address().to_string().starts_with("hash-"));
    assert!(vault.address().to_string().starts_with("hash-"));
    assert!(distributor.address().to_string().starts_with("hash-"));
    assert!(audit.address().to_string().starts_with("hash-"));

    println!("registry={:?}", registry.address());
    println!("token={:?}", token.address());
    println!("vault={:?}", vault.address());
    println!("distributor={:?}", distributor.address());
    println!("audit={:?}", audit.address());
    assert_eq!(DEPLOY_GAS, 450_000_000_000);
}
