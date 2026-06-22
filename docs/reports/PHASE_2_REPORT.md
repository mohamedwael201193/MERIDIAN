# PHASE 2 REPORT — Smart Contracts

**Phase:** 2  
**Status:** Complete  
**Date:** 2026-06-28 (updated after testnet deploy)  
**Readiness score:** 92/100

---

## Completed work

- Implemented all five MERIDIAN Odra **2.8.2** contracts in `contracts/meridian-contracts/`
- Shared types in `contracts/meridian-types/`
- WASM artifacts built and **Casper-optimized** in `contracts/wasm/`
- **28/28** unit tests passing via `cargo odra test`
- Events, errors, access control, timelock, and upgrade patterns implemented
- **Bulk-memory fix** for LLVM 20 / Rust nightly (`contracts/.cargo/config.toml` + `scripts/optimize-wasm-for-casper.sh`)

## Architecture decisions

| Decision | Rationale |
| --- | --- |
| Single crate `meridian-contracts` | Avoids circular deps between token ↔ compliance registry |
| Odra 2.8.2 + nightly-2026-01-01 | Required by Odra 2.8.2 proc macros |
| `env().delegate/undelegate` for StakingVault | Official Odra 2.8 pattern |
| Timelock via shared `timelock.rs` | 24h (`TIMELOCK_DURATION_MS`) for officer/rules/fee/upgrade |
| CEP-18 via `odra_modules::cep18_token` | Standard token interface with compliance hooks |
| `wasm-opt --llvm-memory-copy-fill-lowering` | Casper testnet VM rejects bulk-memory WASM from modern Rust |

## Contracts

1. **ComplianceRegistry** — holder attestation, revoke/reinstate, rules timelock, officer role  
2. **MeridianToken** — CEP-18 + compliance registry hooks, yield accrual, revoke/reinstate  
3. **StakingVault** — payable deposit, delegate/undelegate, restake, claim_rewards  
4. **YieldDistributor** — pro-rata distribute, protocol fee (250 bps), holder registry  
5. **MeridianAudit** — audit summary storage, AUDIT_SIGNER role  

## Tests executed

| Category | Count | Result |
| --- | ---: | --- |
| Unit / integration-style (Odra VM) | 28 | **PASS** |
| Property / fuzz (cargo-fuzz) | 0 | Not in Phase 2 scope |

```bash
cd contracts && cargo odra test   # 28 passed, 0 failed
```

## WASM metrics (post-optimization)

| Contract | Optimized size | Pre-opt size | Target |
| --- | ---: | ---: | ---: |
| MeridianAudit | 257 KB | 373 KB | 200 KB |
| ComplianceRegistry | 282 KB | 404 KB | 200 KB |
| YieldDistributor | 311 KB | 374 KB | 200 KB |
| StakingVault | 331 KB | 399 KB | 200 KB |
| MeridianToken | 351 KB | 422 KB | 200 KB |

Requires `wasm-opt` (Binaryen) — install via `npm install -g binaryen` or system package.

## Build tooling added

- `contracts/.cargo/config.toml` — `-C target-feature=-bulk-memory`
- `scripts/optimize-wasm-for-casper.sh` — invoked from `scripts/deploy-testnet.sh`

## Known risks

- WASM still above 200 KB plan target (acceptable on testnet; optimize before mainnet)
- Property/fuzz suites not wired
- Live delegate/deposit paths need **50 CSPR** call gas budget on testnet (not 5 CSPR)

## Readiness for Phase 5

Contracts compile, test, and **deploy successfully** on Casper testnet. Phase 5 backend may consume `deployed/addresses.json`.

**STOP:** Phase 5 (backend) not started per authorization.


