# MERIDIAN Security Findings

**Last updated:** 2026-06-28 (Phase 4.5)  
**Scope:** Smart contracts + live testnet integration

## Executive summary

Five contracts are deployed and verified on Casper testnet. Static review, 28 unit tests, and 11 livenet integration tests cover access control, overflow paths, timelocks, and cross-contract boundaries. **No open High or Critical findings.** Live adversarial reverts were verified during Phase 4 with a funded purse; with purse depleted, some `should_panic` tests fail at submission layer (documented in Phase 4.5 report).

## Findings

| ID      | Severity | Area           | Finding                                                           | Status                                                       |
| ------- | -------- | -------------- | ----------------------------------------------------------------- | ------------------------------------------------------------ |
| SEC-001 | **High** | Operations     | Deployer unfunded — no live deployment                            | **Closed** — deployed Phase 4; 5 contracts live              |
| SEC-002 | Medium   | Infrastructure | Odra `get_validator(0)` → 401 on CSPR.cloud auction RPC           | **Mitigated** — `MERIDIAN_VALIDATOR_PUBLIC_KEY` env override |
| SEC-003 | Low      | Build          | WASM 257–359 KB (exceeds 200 KB plan target)                      | **Mitigated** — −20% via wasm-opt; deploy succeeds           |
| SEC-004 | Info     | Access control | `ComplianceRegistry::revoke` requires officer role + 24h timelock | By design — unit + live duplicate test                       |
| SEC-005 | Info     | Token          | `revoke_holder` callable only by registry contract                | Unit tested                                                  |
| SEC-006 | Info     | Vault          | `deposit` mints via vault-only `accrue_yield`                     | Unit tested; 500 CSPR delegated live                         |
| SEC-007 | Info     | Distributor    | `distribute` vault-only; 250 bps default fee                      | Unit + live non-vault revert                                 |
| SEC-008 | Info     | Upgrade        | `schedule_upgrade` + timelock before `execute_upgrade`            | Unit tested; not live-executed                               |
| SEC-009 | Low      | Testing        | Empty purse → adversarial txs fail before contract logic          | **Accepted** — unit tests cover revert codes                 |

## Review checklist (Phase 4.5)

| Check                    | Result                               |
| ------------------------ | ------------------------------------ |
| Access control           | Pass                                 |
| Permission escalation    | Pass                                 |
| Overflow / underflow     | Pass (saturating arithmetic)         |
| Replay                   | Chain-handled                        |
| Upgrade safety           | Pass (VM); live upgrade not executed |
| Storage integrity        | Pass                                 |
| Role management          | Pass                                 |
| Unexpected state changes | Pass (unit)                          |
| Event integrity          | Pass (VM); livenet read disabled     |
| Authorization paths      | Pass                                 |

## Recommendations

1. Refill deployer purse before additional write-heavy testnet work.
2. Index events via CSPR.cloud in backend (Odra livenet cannot read CEP-88).
3. Assign dedicated compliance officer on testnet before testing revoke timelock live.
4. External audit before mainnet (out of current scope).

## Risk acceptance

Smart contract layer is **approved for Phase 5 backend** with documented limitations in `docs/reports/PHASE_4_5_REPORT.md`.
