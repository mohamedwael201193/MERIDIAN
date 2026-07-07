# Final End-to-End Report

**Test date:** 2026-07-08  
**Automated:** `scripts/execution-audit.mjs`, `scripts/test-write-tools.mjs`  
**Manual:** Wallet sign + broadcast (browser required)

## Test wallet

- **Public key:** `020257c5a3d8b76c0c5c8a4d12d6100f201e334dc1fbf53a10bccdc8769c59d969fd`
- **Account hash:** `account-hash-d73864646338c6fef8649847103f8c7c6fd877433866bc059acd95a0548cc216`
- **Balance (UI):** ~4347 CSPR (sufficient for 500 CSPR delegate)

## Automated E2E results

| Test               | Planner    | Unsigned tx | Wallet  | Broadcast | Explorer | Contract state | DB/indexer |
| ------------------ | ---------- | ----------- | ------- | --------- | -------- | -------------- | ---------- |
| Check Yield        | PASS       | N/A         | N/A     | N/A       | N/A      | Read OK        | PASS       |
| Register Holder    | PASS local | PASS local  | PENDING | PENDING   | PENDING  | PENDING        | PENDING    |
| Stake 500 CSPR     | PASS       | PASS        | PENDING | PENDING   | PENDING  | PENDING        | PENDING    |
| Transfer Token     | PASS local | PASS local  | PENDING | PENDING   | PENDING  | PENDING        | PENDING    |
| Vault Deposit      | PASS       | BLOCKED     | N/A     | N/A       | N/A      | N/A            | N/A        |
| Restake            | PASS       | PASS        | PENDING | PENDING   | PENDING  | PENDING        | PENDING    |
| Audit Subscription | PASS       | N/A (402)   | x402    | —         | —        | N/A            | PASS gate  |

## Local verification (post-fix, pre-deploy)

```bash
node scripts/test-write-tools.mjs
```

```
register_holder: PASS
transfer_token: PASS
revoke_holder: PASS
delegate_stake: PASS
deposit_to_vault: EXPECTED_BLOCKED deposit_to_vault requires Odra payable cargo purse wiring (__cargo_purse). Browser wallet TransactionV1 builder does not attach that value yet, so no unsigned deploy was created.
distribute_rewards: EXPECTED_BLOCKED distribute_rewards cannot be signed by a user wallet. StakingVault requires the YieldDistributor contract as caller, so no unsigned deploy was created.
```

Planner smoke checks:

- `Stake 500 CSPR, check yield, run compliance audit` now produces `list_validators` + `delegate_stake`.
- `Stake 500 CSPR` without wallet now fails with `Connect Casper Wallet before requesting an on-chain write operation.`

## UI E2E (fake execution fix)

| Scenario                | Before                             | After                                           |
| ----------------------- | ---------------------------------- | ----------------------------------------------- |
| "Check yield" on /agent | Green Broadcast/Explorer/Confirmed | Live read execution only, no transaction stages |
| Write with unsigned tx  | Wallet stage active                | Unchanged (correct)                             |
| Write after sign        | Explorer with real hash            | Unchanged (correct)                             |
| Error                   | Generic complete                   | "Execution failed" + reason                     |

## Manual E2E script (judge demo)

1. Open https://meridian-frontend-kappa.vercel.app/agent
2. Connect Casper Wallet (verify `020257c5…` shown)
3. Enter: `Delegate stake 500 CSPR`
4. Verify: On-chain execution shows validator read, unsigned deploy, then approval required
5. Click **Sign** on TransactionReviewCard
6. Approve in Casper Wallet popup
7. Verify: Transaction hash displayed
8. Click explorer link → `testnet.cspr.live/deploy/…`
9. Wait for finality chip → Confirmed stage green
10. Re-run yield read — staking context may update after indexer sync

Do not run `Vault deposit 10 CSPR` in the wallet demo until payable cargo-purse wiring is implemented; the tool now blocks before wallet signing.

## Blockers to full PASS on all writes

| Blocker                                        | Status      | Action                                                                            |
| ---------------------------------------------- | ----------- | --------------------------------------------------------------------------------- |
| Planner register shadowed by compliance        | FIXED local | Deploy backend                                                                    |
| Transfer placeholder account hash              | FIXED local | Deploy backend                                                                    |
| Revoke planner route missing                   | FIXED local | Deploy backend                                                                    |
| issue_token missing deployed entrypoint        | Blocked     | Upgrade/redeploy contract before exposing                                         |
| Vault payable cargo-purse wiring missing       | Blocked     | Implement Odra payable TransactionV1 support                                      |
| distribute_rewards user-wallet caller mismatch | Blocked     | Route through YieldDistributor contract/agent path or remove from write templates |
| Indexer event names for vault/audit            | FIXED local | Deploy backend                                                                    |
| UI fake pipeline on reads                      | FIXED local | Deploy frontend                                                                   |
| Wallet automation                              | N/A         | Manual sign required (by design)                                                  |

## Hackathon readiness

| Capability              | Status                                                                                                                                            |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| AI reasoning (planner)  | PASS                                                                                                                                              |
| MCP tool discovery      | PASS                                                                                                                                              |
| Wallet interaction      | PASS (code) / PENDING (live demo)                                                                                                                 |
| Real contract execution | PASS for delegate unsigned; register/revoke/restake are role-gated; vault/distribute blocked before wallet until contract execution path is fixed |
| Explorer verification   | PASS when tx hash exists                                                                                                                          |
| No simulated success    | PASS after UI fix                                                                                                                                 |

## Deploy checklist

```bash
# Backend
pnpm --filter @meridian/mcp-server build
pnpm --filter @meridian/backend build
# Push → Render auto-deploy

# Frontend
pnpm --filter @meridian/frontend build
# Push → Vercel auto-deploy

# Re-audit
node scripts/execution-audit.mjs https://meridian-backend-ikx8.onrender.com
```

## Expected post-deploy audit

| Command         | Expected                              |
| --------------- | ------------------------------------- |
| Register Holder | PASS (unsigned tx)                    |
| Transfer Token  | PASS (with account hash in objective) |
| Revoke Holder   | PASS (unsigned tx)                    |

## Conclusion

MERIDIAN **does** build real unsigned Casper testnet transactions for core write tools when the planner and tx-builder path is healthy. Production failures on register/transfer/revoke were **planner routing and placeholder bugs**, not missing blockchain integration. The UI incorrectly showed write pipeline success on read-only missions — **fixed**.

**Remaining gate:** Deploy fixes + one browser-signed write to produce a live tx hash and explorer link for judges.
