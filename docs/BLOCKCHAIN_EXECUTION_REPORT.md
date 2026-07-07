# Blockchain Execution Report

**Network:** Casper Testnet (`casper-test`)  
**RPC:** CSPR.cloud (via `NEXT_PUBLIC_CASPER_RPC_URL` / backend `CasperRpcClient`)  
**Contracts:** `deployed/addresses.json`

## Write operation matrix

| Command              | Unsigned tx (API)          | Wallet sign | Broadcast   | Explorer     | State change        |
| -------------------- | -------------------------- | ----------- | ----------- | ------------ | ------------------- |
| Delegate 500 CSPR    | PASS (prod)                | Manual      | Manual      | After hash   | Delegation on-chain |
| Vault deposit        | PASS (prod)                | Manual      | Manual      | After hash   | Vault balance       |
| Restake              | PASS (prod)                | Manual      | Manual      | After hash   | Vault delegation    |
| Register holder      | FAIL (prod) / PASS (local) | —           | —           | —            | ComplianceRegistry  |
| Transfer token       | FAIL (prod) / PASS (local) | —           | —           | —            | MRWA balances       |
| Revoke holder        | FAIL (prod) / PASS (local) | —           | —           | —            | ComplianceRegistry  |
| Distribute rewards   | PASS (planner)             | Manual      | Manual      | After hash   | YieldDistributor    |
| issue_token          | NOT IMPLEMENTED            | —           | —           | —            | —                   |
| Premium audit (x402) | N/A (402 gate)             | x402 sign   | Facilitator | Payment hash | Off-chain access    |

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
  → onFinalized() → traces + phase complete
```

## Root causes (historical)

1. **Render build skipped mcp-server** — `Cannot find module tx-builder.js` (fixed: `render.yaml` builds `@meridian/mcp-server`, `resolve-tx-builder.ts` multi-path lookup).
2. **Planner pattern ordering** — "Register holder for compliance" matched read-only compliance branch.
3. **Placeholder account hashes** — `account-hash-required` caused CLKey parse errors.
4. **UI phase mapping** — Read missions advanced to `complete`, faking write pipeline success.

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

Production backend at commit `9cb8c7b` passes delegate/vault/restake but **not** register/transfer/revoke until next deploy with local `planner-service.ts` fixes.

## Required actions

1. Deploy backend with latest planner fixes
2. Fund test wallet (`020257c5…969fd`) for delegate/deposit demos
3. Browser E2E: sign one write (delegate 500 CSPR minimum) and capture tx hash on testnet.cspr.live
