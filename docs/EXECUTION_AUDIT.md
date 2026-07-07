# MERIDIAN Execution Audit

**Date:** 2026-07-07  
**Backend tested:** `https://meridian-backend-ikx8.onrender.com`  
**Evidence:** `docs/reports/execution-audit-prod-2026-07-07.json`, `scripts/execution-audit.mjs`

## Executive summary

| Category                                           | Status                                                                                      |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Read flows (yield, compliance)                     | **PASS** — real indexer/RPC data, no fake write stages                                      |
| Write tx construction (delegate, vault, restake)   | **PASS** on production                                                                      |
| Write tx construction (register, transfer, revoke) | **FAIL** on production — planner routing / placeholder args (fixed locally, pending deploy) |
| UI pipeline (Broadcast/Explorer/Confirmed)         | **FIXED locally** — read-only missions no longer show fake write stages                     |
| Wallet sign + broadcast + finality                 | **Requires browser** — cannot be fully automated without Casper Wallet popup                |

## Per-command audit (12 checks)

Legend: **PASS** / **FAIL** / **N/A** (read-only step)

### Check Yield — `What is the current MRWA yield APY?`

| #   | Stage                 | Result | Reason                                |
| --- | --------------------- | ------ | ------------------------------------- |
| 1   | Planner executes      | PASS   | HTTP 200, `get_yield_rate` step       |
| 2   | MCP receives request  | N/A    | Planner invokes read tools in-process |
| 3   | Write tool executes   | N/A    | Read-only                             |
| 4   | Transaction builder   | N/A    | Read-only                             |
| 5   | Unsigned transaction  | N/A    | None expected                         |
| 6   | Casper Wallet invoked | N/A    | None expected                         |
| 7   | Wallet signs          | N/A    |                                       |
| 8   | Broadcast             | N/A    |                                       |
| 9   | Transaction hash      | N/A    |                                       |
| 10  | Finality              | N/A    |                                       |
| 11  | Explorer opens        | N/A    | UI skips write chain stages           |
| 12  | On-chain state change | N/A    | Read-only                             |

**Required fix:** None.

---

### Compliance audit — `Run compliance audit on my wallet`

| #    | Stage            | Result | Reason                                           |
| ---- | ---------------- | ------ | ------------------------------------------------ |
| 1    | Planner executes | PASS   | `get_compliance_status` with caller account hash |
| 2–12 | Write chain      | N/A    | Read-only                                        |

**Required fix:** None.

---

### Delegate 500 CSPR — `Delegate stake 500 CSPR`

| #   | Stage                 | Result  | Reason                                            |
| --- | --------------------- | ------- | ------------------------------------------------- |
| 1   | Planner executes      | PASS    |                                                   |
| 2   | MCP / write invoker   | PASS    | `delegate_stake` via `write-tool-invoker.ts`      |
| 3   | Write tool executes   | PASS    |                                                   |
| 4   | Transaction builder   | PASS    | `NativeDelegateBuilder`                           |
| 5   | Unsigned transaction  | PASS    | Returned in planner response                      |
| 6   | Casper Wallet invoked | PENDING | Requires user clicking Sign in browser            |
| 7   | Wallet signs          | PENDING |                                                   |
| 8   | Broadcast             | PENDING | `/api/transactions/submit` → `rpc.putTransaction` |
| 9   | Transaction hash      | PENDING | After sign                                        |
| 10  | Finality              | PENDING | `pollTransactionStatus`                           |
| 11  | Explorer              | PENDING | Only shown when `txHash` present (UI fix applied) |
| 12  | On-chain state change | PENDING | After broadcast                                   |

**Required fix:** None for tx construction. Demo requires funded wallet + user approval.

---

### Vault Deposit — `Vault deposit 10 CSPR`

| #    | Stage                 | Result  | Reason             |
| ---- | --------------------- | ------- | ------------------ |
| 1–5  | Planner → unsigned tx | PASS    | `deposit_to_vault` |
| 6–12 | Wallet → chain        | PENDING | Browser step       |

**Required fix:** None for tx construction.

---

### Register Holder — `Register holder for compliance`

| #    | Stage                | Result   | Reason                                                                 |
| ---- | -------------------- | -------- | ---------------------------------------------------------------------- |
| 1    | Planner executes     | PASS     | HTTP 200                                                               |
| 2    | Write tool selected  | **FAIL** | Production matches generic `compliance` read pattern before `register` |
| 3    | Write tool executes  | **FAIL** | `register_holder` never invoked on prod                                |
| 4    | Transaction builder  | **FAIL** |                                                                        |
| 5    | Unsigned transaction | **FAIL** |                                                                        |
| 6–12 | Wallet → chain       | **FAIL** | Blocked upstream                                                       |

**Required fix:** Reorder planner patterns — `register` before generic compliance (fixed in `planner-service.ts`). Use `callerAccountHash` when objective has no explicit hash. **Deploy backend.**

**Local verification:** `node scripts/test-write-tools.mjs` → `register_holder: PASS`

---

### Transfer Token — `Transfer 1 MRWA to account-hash-…`

| #    | Stage            | Result   | Reason                                                    |
| ---- | ---------------- | -------- | --------------------------------------------------------- |
| 1    | Planner executes | **FAIL** | HTTP 422 `Invalid string length, expected 64 characters`  |
| 2–12 |                  | **FAIL** | Production still uses placeholder `account-hash-required` |

**Required fix:** Parse recipient from objective; reject early if missing (fixed locally). **Deploy backend.**

**Local verification:** `transfer_token: PASS`

---

### Restake — `Restake between validators`

| #    | Stage                 | Result  | Reason                                                |
| ---- | --------------------- | ------- | ----------------------------------------------------- |
| 1–5  | Planner → unsigned tx | PASS    | Validator placeholders resolved via `list_validators` |
| 6–12 | Wallet → chain        | PENDING | Requires VALIDATOR_CURATOR on-chain                   |

**Required fix:** None for tx construction.

---

### Revoke Holder — `Revoke holder account-hash-…`

| #    | Stage            | Result   | Reason                                  |
| ---- | ---------------- | -------- | --------------------------------------- |
| 1    | Planner executes | PASS     | HTTP 200                                |
| 2    | Write tool       | **FAIL** | No `revoke` planner route on production |
| 3–12 |                  | **FAIL** | Falls through to read-only default      |

**Required fix:** Add `revoke_holder` planner route (fixed locally). **Deploy backend.**

**Local verification:** `revoke_holder: PASS`

---

### Audit Subscription — `Subscribe to premium x402 audit feed`

| #    | Stage            | Result | Reason                                                 |
| ---- | ---------------- | ------ | ------------------------------------------------------ |
| 1    | Planner executes | PASS   |                                                        |
| 2    | subscribe_audit  | PASS   | Returns `PAYMENT_REQUIRED` / 402 without x402 header   |
| 3–12 | On-chain write   | N/A    | Premium audit is x402-gated read, not a contract write |

**Required fix:** None — correct behavior.

---

### Token Issue — `Issue new MRWA tokens`

| #   | Stage            | Result              | Reason                              |
| --- | ---------------- | ------------------- | ----------------------------------- |
| 1   | Planner executes | PASS                | Falls back to read default          |
| 2   | issue_token tool | **NOT IMPLEMENTED** | Not in `WRITE_TOOLS` or MCP catalog |

**Required fix:** Implement `issue_token` entrypoint in tx-builder + planner if product requires minting.

---

## Phase 2 — Fake execution removal

| Component                   | Before                                                                           | After                                                                       |
| --------------------------- | -------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `AgentPipeline.tsx`         | `phase === 'complete'` marked Broadcast/Explorer/Confirmed done without `txHash` | Write chain stages skipped unless `isWriteFlow`; explorer requires `txHash` |
| `useAgentRuntime.ts`        | Read flows set `phase: 'complete'`                                               | Read flows set `phase: 'read_complete'`                                     |
| `AgentExecutionConsole.tsx` | Phase index advanced all stages as done                                          | Write stages hidden for read flows                                          |

## Critical bugs fixed (local, pending deploy)

1. Planner `register` shadowed by compliance read matcher
2. `transfer_token` / `register_holder` used `account-hash-required` placeholder
3. Missing `revoke_holder` planner route
4. UI showed green Broadcast/Explorer/Confirmed on read-only missions

## Re-run audit

```bash
node scripts/execution-audit.mjs https://meridian-backend-ikx8.onrender.com
node scripts/test-write-tools.mjs
```
