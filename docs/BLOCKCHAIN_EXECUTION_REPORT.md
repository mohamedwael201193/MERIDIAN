# Blockchain Execution Report

**Network:** Casper Testnet (`casper-test`)  
**RPC:** CSPR.cloud (via `NEXT_PUBLIC_CASPER_RPC_URL` / backend `CasperRpcClient`)  
**Contracts:** `deployed/addresses.json`

## Write operation matrix

| Command              | Unsigned tx (API)     | Wallet sign | Broadcast   | Explorer     | State change                              |
| -------------------- | --------------------- | ----------- | ----------- | ------------ | ----------------------------------------- |
| Delegate 500 CSPR    | PASS (prod)           | Manual      | Manual      | After hash   | Delegation on-chain                       |
| Vault deposit        | BLOCKED before wallet | —           | —           | —            | Requires payable `__cargo_purse` wiring   |
| Restake              | PASS (prod)           | Manual      | Manual      | After hash   | Vault delegation                          |
| Register holder      | PASS (local)          | Manual      | Manual      | After hash   | ComplianceRegistry                        |
| Transfer token       | PASS (local)          | Manual      | Manual      | After hash   | MRWA balances                             |
| Revoke holder        | PASS (local)          | Manual      | Manual      | After hash   | ComplianceRegistry                        |
| Distribute rewards   | BLOCKED before wallet | —           | —           | —            | Requires YieldDistributor contract caller |
| issue_token          | BLOCKED BY ABI        | —           | —           | —            | No deployed entrypoint                    |
| Premium audit (x402) | N/A (402 gate)        | x402 sign   | Facilitator | Payment hash | Off-chain access                          |

## Execution path (verified in code)

```
Browser (useAgentRuntime)
  → POST /api/v1/planner/execute (Next proxy → Render backend)
  → PlannerService.execute()
  → invokeWriteTool() → loadTxBuilder() → mcp-server/dist/casper/tx-builder.js
  → unsigned TransactionV1 JSON returned
  → TransactionReviewCard → useWalletActions.signAndSubmit()
  → CasperWalletProvider.sign() OR CSPR.click sign()
  → POST /api/transactions/submit → casper-js-sdk Transaction.putTransaction()
  → transactionHash returned
  → TransactionStatus polls /api/transactions/status/:hash
  → onFinalized() → finality trace + backend/indexer read revalidation + phase complete
```

## Root causes (historical)

1. **Render build skipped mcp-server** — `Cannot find module tx-builder.js` (fixed: `render.yaml` builds `@meridian/mcp-server`, `resolve-tx-builder.ts` multi-path lookup).
2. **Planner pattern ordering** — "Register holder for compliance" matched read-only compliance branch.
3. **Placeholder account hashes** — `account-hash-required` caused CLKey parse errors.
4. **UI phase mapping** — Read missions advanced to `complete`, faking write pipeline success.
5. **Mixed objective precedence** — "stake + compliance audit" matched read-only audit before staking (fixed).
6. **Attestation ABI mismatch** — `register_holder` sent a byte array instead of Odra `Attestation` bytesrepr (fixed).
7. **Vault payable mismatch** — `deposit_to_vault` returned a contract call without Odra `__cargo_purse`; now fails before wallet signing.
8. **Reward distribution caller mismatch** — user wallet cannot call `StakingVault.distribute_rewards`; only YieldDistributor contract caller can.
9. **Indexer event-name drift** — backend listened for `Deposited` / `AuditRecorded`; contracts emit `DepositReceived`, `Staked`, and `AuditSummarySubmitted` (fixed locally).

## Import / build verification

| Path                                         | Status                 |
| -------------------------------------------- | ---------------------- |
| `backend/dist/planner/write-tool-invoker.js` | PASS                   |
| `mcp-server/dist/casper/tx-builder.js`       | PASS                   |
| `backend/dist/deployed/addresses.json`       | PASS (copied at build) |
| `resolve-tx-builder.ts` candidate paths      | PASS (4 fallbacks)     |

```bash
pnpm --filter @meridian/mcp-server build
pnpm --filter @meridian/backend build
node scripts/test-write-tools.mjs
```

## Deployment gate

Production backend must be redeployed for planner precedence, `register_holder` Attestation encoding, wallet balance API, indexer event-name fixes, honest vault-deposit blocking, and no-fake-read UI semantics.

## Required actions

1. Deploy backend with latest planner/indexer/tx-builder fixes
2. Fund test wallet (`020257c5…969fd`) for delegate demo
3. Browser E2E: sign one write (delegate 500 CSPR minimum) and capture tx hash on testnet.cspr.live
4. Implement Odra payable cargo-purse support before re-enabling vault deposit
