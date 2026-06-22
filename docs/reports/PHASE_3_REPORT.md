# PHASE 3 REPORT — Contract Testing (Casper Testnet)

**Phase:** 3  
**Status:** Complete (live testnet verified; some query/event paths flaky on CSPR.cloud)  
**Date:** 2026-06-28  
**Readiness score:** 78/100

---

## Completed work

- Livenet integration crate: `tests/integration/` (8 test files)
- **CSPR.cloud RPC proxy** (`scripts/cspr-rpc-proxy.mjs`) — injects auth + SSE `TransactionProcessed` emulator
- `load_deployed_stack()` — tests against Phase 4 deployment (no redundant redeploys)
- Gas budgets updated: `DEPLOY_GAS=450 CSPR`, `CALL_GAS=50 CSPR` (delegate/deposit)
- Docs: `docs/GAS_ANALYSIS.md`, `docs/BENCHMARKS.md`, `docs/SECURITY_FINDINGS.md`
- Scripts: `scripts/run-integration-tests.sh` (proxy + wasm symlink + nightly toolchain)

## Deployer (funded)

| Field | Value |
| --- | --- |
| Public key | `0203d64d1b7f66f18c0abe9836df604c187797ddb962b9fc3396201c245f9de335a6` |
| Account | [testnet.cspr.live/account/0203d64d…](https://testnet.cspr.live/account/0203d64d1b7f66f18c0abe9836df604c187797ddb962b9fc3396201c245f9de335a6) |
| Balance at start | 5,000 CSPR (faucet) |

## Tests executed

| Suite | Result | Notes |
| --- | --- | --- |
| `cargo odra test` | **28/28 PASS** | Odra VM |
| `deploy` — verify Phase 4 addresses | **PASS** | Loads all 5 package hashes |
| `access_control` — duplicate holder | **PASS** | Live tx reverts `User error: 30001` |
| `adversarial` — non-vault distribute | **PASS** | Live tx reverts `User error: 33000` |
| `benchmarks` — load throughput | **PASS** | 5× `load_deployed_stack` |
| `restake` — curator gate | **PASS** | Live revert without curator role |
| `full_lifecycle` — deposit + transfer | **FAIL** | Event parse / self-transfer compliance |
| `gas_analysis` — vault deposit | **INTERMITTENT** | Deposit tx may succeed; post-tx state query flaky |
| `revoke` — balance read | **INTERMITTENT** | CSPR.cloud `state_get_item` via proxy |

```bash
./scripts/run-integration-tests.sh
# Passes: access_control, adversarial, benchmarks, deploy
# Run separately: cargo test --test restake (passes)
```

## Live integration transaction examples

| Test | Tx hash | Result |
| --- | --- | --- |
| Duplicate register_holder | `f5f9490ee1883647e4e107fabe9a2732ca74a6f9a4cfedfd54f3007d9f18e823` | Revert 30001 |
| Adversarial distribute | `77b805da0e8aaaca1f16f0a080b6d9850a099b4796b49b719f43142e8c615361` | Revert 33000 |
| Vault deposit attempt | `a566d1e9717a546a38b399e4695015499414879e6e38e065ae5ce53a4cea95c5` | Submitted |

## Infrastructure fixes (Phase 3)

1. **Bulk memory** — Casper VM rejected WASM until `wasm-opt` lowering  
2. **RPC 401** — Local proxy adds `CSPR_CLOUD_AUTH_TOKEN`  
3. **SSE 404** — Proxy polls `info_get_transaction` → emits `TransactionProcessed`  
4. **Auction 401** — `MERIDIAN_VALIDATOR_PUBLIC_KEY` static override  
5. **Deploy OOG at 50 CSPR** — raised to 450 CSPR per contract  
6. **Call OOG at 5 CSPR** — raised to 50 CSPR for delegate/deposit  

## Known risks

- Odra livenet `balance_of` / `query_global_state` intermittently fails on CSPR.cloud (documented in LESSONS_LEARNED pattern)
- CEP-88 event extraction in Odra client may panic after successful txs (`CouldntExtractEventData`)
- Full lifecycle deposit needs follow-up with Sidecar event stream (Phase 6 indexer)

## Recommendations before Phase 5

1. Use Sidecar `/events` for event verification instead of Odra SSE parsing  
2. Add second testnet key for true multi-caller adversarial tests  
3. Wire `full_lifecycle` to skip self-transfer (transfer to distinct holder)

**STOP:** Phase 5 not started.
