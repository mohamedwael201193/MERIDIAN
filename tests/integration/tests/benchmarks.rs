use meridian_integration_tests::*;

#[test]
fn deployed_stack_load_throughput() {
    let env = livenet_env();
    let start = std::time::Instant::now();
    for _ in 0..5 {
        let _stack = load_deployed_stack(&env);
    }
    let elapsed = start.elapsed();
    println!("5 load_deployed_stack calls in {elapsed:?}");
    assert!(elapsed.as_secs() < 30);
}
