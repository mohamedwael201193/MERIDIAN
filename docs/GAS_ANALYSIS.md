# MERIDIAN Gas Analysis (Casper Testnet)

**Status:** Live measurements captured (Phase 4.5)  
**Generated:** 2026-06-28

## Summary

Five contracts deployed on `casper-test` with deployer `0203d64d1b7f66f18c0abe9836df604c187797ddb962b9fc3396201c245f9de335a6`. Gas limits were raised during Phase 3–4 after out-of-gas failures; actual consumption is below budget on successful deploys.

## Gas budgets (Odra livenet / deploy script)

| Operation | Gas limit (motes) | CSPR equivalent | Notes |
| --- | ---: | ---: | --- |
| Contract deploy (each) | 450,000,000,000 | 450 CSPR max | Required for large WASM packages |
| Wiring / register_holder | 50,000,000,000 | 50 CSPR max | Cross-contract calls |
| StakingVault::deposit | 50,000,000,000 | 50 CSPR max | Includes delegate + accrue_yield |
| Read-only queries | 0 | 0 | Offline execution |

## Live consumption (examples)

| Operation | Limit | Consumed | Refund | Tx hash |
| --- | ---: | ---: | ---: | --- |
| Deploy ComplianceRegistry | 450 CSPR | ~247 CSPR | ~152 CSPR | [930efed7…](https://testnet.cspr.live/transaction/930efed7e6e20e36b4f3a4d03bbe0a5952160f277c9c14387659da5a311b1bd8) |

Five deploys + wiring consumed approximately **2,500 CSPR** from initial 5,000 CSPR faucet grant. **500 CSPR** delegated via StakingVault (`get_total_staked = 500_000_000_000` motes).

## WASM sizes

| Contract | Phase 2 (bytes) | Phase 4.5 optimized | Change |
| --- | ---: | ---: | ---: |
| ComplianceRegistry | 404,032 | 289,051 | −28.5% |
| MeridianToken | 421,588 | 359,324 | −14.8% |
| StakingVault | 398,717 | 339,061 | −15.0% |
| YieldDistributor | 373,856 | 318,560 | −14.8% |
| MeridianAudit | 372,962 | 262,885 | −29.5% |

Optimization pipeline: `scripts/optimize-wasm-for-casper.sh` (`wasm-opt -Oz`, bulk-memory disable, optional `wasm-strip`).

## Commands

```bash
./scripts/deploy-testnet.sh
./scripts/run-integration-tests.sh
curl -s https://node.testnet.casper.network/rpc -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","method":"info_get_transaction","params":{"transaction_hash":{"Version1":"<HASH>"}},"id":1}'
```
