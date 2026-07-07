# MERIDIAN Benchmarks (Casper Testnet)

**Status:** Complete (Phase 4.5)  
**Generated:** 2026-06-28

## Unit test performance (Odra VM)

| Suite                                  | Tests |   Time |
| -------------------------------------- | ----: | -----: |
| `cargo odra test` (meridian-contracts) |    28 | ~0.12s |
| `meridian-types`                       |     0 |      — |

## Integration tests (live testnet)

| Test file           | Purpose                          | Status           |
| ------------------- | -------------------------------- | ---------------- |
| `deploy.rs`         | Verify 5 deployed package hashes | **PASS**         |
| `full_lifecycle.rs` | Staked state + MRWA balance      | **PASS**         |
| `benchmarks.rs`     | 5× `load_deployed_stack` latency | **PASS** (< 30s) |
| `gas_analysis.rs`   | Idempotent deposit / gas budgets | **PASS**         |
| `access_control.rs` | Duplicate holder reverts         | **PASS**         |
| `adversarial.rs`    | Non-vault distribute reverts     | **PASS**         |
| `restake.rs`        | Non-curator restake reverts      | **PASS**         |
| `revoke.rs`         | Compliant holder balance         | **PASS**         |

**Total:** 11 integration tests, all passing against live deployed contracts.

## Stability (Phase 4.5)

```bash
./scripts/stability-run.sh 10
# 10/10 consecutive passes (28 unit + 11 integration per run, ~85s total)
```

## Livenet throughput (observed)

| Operation                     | Target   | Observed                    |
| ----------------------------- | -------- | --------------------------- |
| Read-only stack load (5×)     | < 30s    | PASS                        |
| Full integration suite        | < 15s    | ~10s                        |
| Contract deploy (5 contracts) | < 15 min | ~10 min (Phase 4)           |
| Deposit + delegate            | < 30s    | Succeeded (500 CSPR staked) |

## Run commands

```bash
cd contracts && cargo odra test
./scripts/run-integration-tests.sh
./scripts/stability-run.sh 10
./scripts/verify-testnet.sh
```
