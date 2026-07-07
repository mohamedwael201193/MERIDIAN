# MERIDIAN Execution Audit

**Date:** 2026-07-08  
**Backend tested:** `https://meridian-backend-ikx8.onrender.com`  
**Evidence:** `docs/reports/execution-audit-prod-2026-07-07.json`, `scripts/execution-audit.mjs`

## Executive summary

| Category                                           | Status                                                                                                                     |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Read flows (yield, compliance)                     | **PASS** — real indexer/RPC data, no fake write stages                                                                     |
| Write tx construction (delegate, restake)          | **PASS** — unsigned tx generation works; role-gated writes still require the right signer                                  |
| Write tx construction (vault deposit)              | **BLOCKED honestly** — no unsigned deploy is created until Odra payable `__cargo_purse` wiring exists                      |
| Write tx construction (register, transfer, revoke) | **PASS locally** — planner routing, account hash args, and register attestation encoding fixed; on-chain roles still apply |
| UI pipeline (Broadcast/Explorer/Confirmed)         | **FIXED locally** — read-only missions never show transaction stages                                                       |
| Wallet sign + broadcast + finality                 | **Requires browser** — cannot be fully automated without Casper Wallet popup                                               |

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

| #    | Stage                | Result            | Reason                                                                                                                                        |
| ---- | -------------------- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | Planner executes     | PASS              | Routes to `deposit_to_vault`                                                                                                                  |
| 2–3  | Write tool executes  | PASS              | Invokes tx-builder                                                                                                                            |
| 4    | Transaction builder  | **FAIL honestly** | StakingVault `deposit` is Odra payable and requires `__cargo_purse`; current browser TransactionV1 builder only supports payment/runtime args |
| 5    | Unsigned transaction | **N/A**           | No invalid deploy is returned                                                                                                                 |
| 6–12 | Wallet → chain       | **N/A**           | Wallet is not invoked for a transaction that would revert `ZeroDeposit`                                                                       |

**Required fix:** Implement a real payable/cargo-purse transaction template for Odra `#[odra(payable)]` entrypoints, then re-enable wallet signing.

---

### Register Holder — `Register holder for compliance`

| #    | Stage                | Result  | Reason                                                                  |
| ---- | -------------------- | ------- | ----------------------------------------------------------------------- |
| 1    | Planner executes     | PASS    | Local planner selects `register_holder` before generic compliance reads |
| 2    | Write tool selected  | PASS    |                                                                         |
| 3    | Write tool executes  | PASS    | `register_holder` invokes tx-builder                                    |
| 4    | Transaction builder  | PASS    | Encodes Odra `Attestation` bytesrepr as `CLAny`                         |
| 5    | Unsigned transaction | PASS    |                                                                         |
| 6–12 | Wallet → chain       | PENDING | Requires contract owner wallet signing and broadcast                    |

**Required fix:** Deploy backend/MCP build containing planner precedence and Attestation encoder. Demo wallet must be the ComplianceRegistry owner.

**Local verification:** `node scripts/test-write-tools.mjs` → `register_holder: PASS`

---

### Transfer Token — `Transfer 1 MRWA to account-hash-…`

| #    | Stage            | Result  | Reason                                                                 |
| ---- | ---------------- | ------- | ---------------------------------------------------------------------- |
| 1    | Planner executes | PASS    | Local planner parses explicit recipient and rejects missing hash early |
| 2–5  | Write tx build   | PASS    | `transfer_token` unsigned TransactionV1 builds locally                 |
| 6–12 | Wallet → chain   | PENDING | Requires browser wallet signing and compliant recipient state          |

**Required fix:** Deploy backend. Demo objective must include a real recipient account hash.

**Local verification:** `transfer_token: PASS`

---

### Restake — `Restake between validators`

| #    | Stage                 | Result  | Reason                                                |
| ---- | --------------------- | ------- | ----------------------------------------------------- |
| 1–5  | Planner → unsigned tx | PASS    | Validator placeholders resolved via `list_validators` |
| 6–12 | Wallet → chain        | PENDING | Requires VALIDATOR_CURATOR on-chain                   |

**Required fix:** Demo wallet must hold `VALIDATOR_CURATOR`, otherwise the transaction is expected to revert.

---

### Revoke Holder — `Revoke holder account-hash-…`

| #    | Stage            | Result  | Reason                                                       |
| ---- | ---------------- | ------- | ------------------------------------------------------------ |
| 1    | Planner executes | PASS    | Local planner selects `revoke_holder` route                  |
| 2–5  | Write tx build   | PASS    | `revoke` entrypoint targeted on ComplianceRegistry           |
| 6–12 | Wallet → chain   | PENDING | Requires compliance officer role and browser wallet approval |

**Required fix:** Deploy backend. Demo wallet must hold the compliance officer role.

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

| #   | Stage            | Result        | Reason                                                     |
| --- | ---------------- | ------------- | ---------------------------------------------------------- |
| 1   | Planner executes | FAIL honestly | Planner rejects issue/mint objective                       |
| 2   | issue_token tool | **BLOCKED**   | Deployed MeridianToken has no public issue/mint entrypoint |

**Required fix:** Contract upgrade/redeploy with a real owner-gated issue/mint entrypoint before exposing this as a runnable write.

---

## Phase 2 — Fake execution removal

| Component                   | Before                                                                           | After                                                                              |
| --------------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `AgentPipeline.tsx`         | `phase === 'complete'` marked Broadcast/Explorer/Confirmed done without `txHash` | Write chain stages skipped unless `isWriteFlow`; explorer requires `txHash`        |
| `useAgentRuntime.ts`        | Read flows set `phase: 'complete'`                                               | Read flows set `phase: 'read_result'`; `complete` is reserved for finalized writes |
| `AgentExecutionConsole.tsx` | Phase index advanced all stages as done                                          | Write stages hidden for read flows                                                 |
| `TransactionReviewCard.tsx` | Printed Explorer text before tx hash                                             | Explorer URL appears only after tx hash                                            |

## Critical bugs fixed (local, pending deploy)

1. Planner `register` shadowed by compliance read matcher
2. `transfer_token` / `register_holder` used `account-hash-required` placeholder
3. Missing `revoke_holder` planner route
4. UI showed green Broadcast/Explorer/Confirmed on read-only missions
5. Mixed objectives with "stake" + "compliance audit" downgraded to read-only audit
6. `register_holder` encoded `Attestation` as placeholder byte array
7. `deposit_to_vault` returned an unsigned tx without payable `__cargo_purse`; now blocked before wallet signing
8. Indexer listened for `Deposited` / `AuditRecorded` while contracts emit `DepositReceived` / `Staked` / `AuditSummarySubmitted`

## Re-run audit

```bash
node scripts/execution-audit.mjs https://meridian-backend-ikx8.onrender.com
node scripts/test-write-tools.mjs
```
