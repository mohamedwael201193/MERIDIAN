# Write Pipeline Report

Traces each write command through the full pipeline. Stages marked **VERIFIED** have code + test evidence; **PENDING** require browser wallet.

## Shared pipeline

```
User objective (AgentHomePage / AgentConsolePage)
  ↓ VERIFIED — useAgentRuntime.execute()
Planner (POST /api/v1/planner/execute)
  ↓ VERIFIED — PlannerService.buildPlan + execute
MCP / Write invoker (in-process, not HTTP round-trip)
  ↓ VERIFIED — write-tool-invoker.ts
Write Tool
  ↓ VERIFIED — WRITE_TOOLS set
Transaction Builder
  ↓ VERIFIED — TransactionBuilder in mcp-server
Unsigned Transaction
  ↓ VERIFIED — JSON with network, chainName, transactionType, transaction
Wallet Request
  ↓ VERIFIED — TransactionReviewCard + phase 'wallet'
Wallet Signature
  ↓ PENDING — CasperWalletProvider.sign() / CSPR.click
Broadcast RPC
  ↓ VERIFIED — /api/transactions/submit → putTransaction
Transaction Hash
  ↓ PENDING — after sign
Finality
  ↓ VERIFIED — pollTransactionStatus → /api/transactions/status/:hash
Explorer
  ↓ VERIFIED — explorerTxUrl(hash) only when txHash set
Success
  ↓ PENDING — onFinalized + indexer poll
```

---

## transfer_token

| Stage            | Status                 | Evidence                                                  |
| ---------------- | ---------------------- | --------------------------------------------------------- |
| Planner          | FAIL prod / PASS local | Prod 422; local builds `transfer` contract call           |
| MCP              | VERIFIED               | `write-tools.ts` + `write-tool-invoker.ts`                |
| Tx builder       | VERIFIED               | `buildTransferToken` → MeridianToken `transfer`           |
| Unsigned tx      | PASS local             | `scripts/test-write-tools.mjs`                            |
| Wallet → Success | PENDING                | User must include recipient `account-hash-…` in objective |

**Fix:** Deploy planner recipient parsing fix.

---

## delegate_stake

| Stage                | Status   | Evidence                                   |
| -------------------- | -------- | ------------------------------------------ |
| Planner              | PASS     | `execution-audit-prod` HTTP 200            |
| Validator resolution | VERIFIED | `list_validators` → first validator pubkey |
| Tx builder           | VERIFIED | `NativeDelegateBuilder`, min 500 CSPR      |
| Unsigned tx          | PASS     | audit JSON                                 |
| Wallet → Success     | PENDING  | 500 CSPR minimum + wallet funds            |

---

## deposit_to_vault

| Stage            | Status           | Evidence                                                                                                             |
| ---------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------- |
| Planner          | PASS             | Parses CSPR → motes and routes to `deposit_to_vault`                                                                 |
| Tx builder       | BLOCKED honestly | StakingVault `deposit` requires Odra payable `__cargo_purse`; current browser TransactionV1 builder cannot attach it |
| Unsigned tx      | N/A              | No invalid deploy is returned                                                                                        |
| Wallet → Success | N/A              | Wallet is not invoked until payable wiring is real                                                                   |

**Fix:** Implement a real payable/cargo-purse TransactionV1 template for Odra `#[odra(payable)]` calls.

---

## restake

| Stage            | Status   | Evidence                                       |
| ---------------- | -------- | ---------------------------------------------- |
| Planner          | PASS     | Resolves from/to validators                    |
| Tx builder       | VERIFIED | StakingVault `restake`, VALIDATOR_CURATOR role |
| Unsigned tx      | PASS     | audit JSON                                     |
| Wallet → Success | PENDING  | On-chain role required                         |

---

## register_holder

| Stage            | Status     | Evidence                              |
| ---------------- | ---------- | ------------------------------------- |
| Planner          | FAIL prod  | Only `get_compliance_status` returned |
| Planner          | PASS local | register before compliance matcher    |
| Tx builder       | VERIFIED   | ComplianceRegistry `register_holder`  |
| Unsigned tx      | PASS local | test-write-tools                      |
| Wallet → Success | PENDING    | Requires contract owner signer        |

---

## revoke_holder

| Stage            | Status                 | Evidence                    |
| ---------------- | ---------------------- | --------------------------- |
| Planner          | FAIL prod / PASS local | New revoke route added      |
| Tx builder       | VERIFIED               | ComplianceRegistry `revoke` |
| Unsigned tx      | PASS local             | test-write-tools            |
| Wallet → Success | PENDING                | COMPLIANCE_OFFICER role     |

---

## distribute_rewards

| Stage            | Status           | Evidence                                                                 |
| ---------------- | ---------------- | ------------------------------------------------------------------------ |
| Planner          | PASS             | Routes reward distribution objectives                                    |
| Tx builder       | BLOCKED honestly | StakingVault requires YieldDistributor contract as caller                |
| Unsigned tx      | N/A              | No user-wallet deploy is returned                                        |
| Wallet → Success | N/A              | Requires contract/agent execution path, not Casper Wallet user signature |

---

## issue_token

| Stage           | Status          | Evidence                  |
| --------------- | --------------- | ------------------------- |
| Entire pipeline | NOT IMPLEMENTED | No tool in MCP or planner |

---

## audit subscription (x402)

| Stage          | Status   | Evidence                                 |
| -------------- | -------- | ---------------------------------------- |
| Planner        | PASS     | `subscribe_audit` read step              |
| x402 gate      | VERIFIED | `PAYMENT_REQUIRED` without header        |
| On-chain write | N/A      | Paid resource access, not contract write |

**Flow after payment:** x402 header → audit summaries from backend index.
