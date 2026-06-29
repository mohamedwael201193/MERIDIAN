# MERIDIAN Blockchain Transaction Root Cause Report

**Date:** 2026-07-06  
**Status:** Investigation complete — root causes identified with reproducible proof  
**Scope:** Issue Token, Staking/Restake, x402, MCP write tools, RPC submission  
**Constraint honored:** No production code changed during this investigation

---

## Executive Summary

Wallet connection and signing work. Failures occur **after** the wallet returns a signature, in MERIDIAN’s transaction construction, authorization verification, or RPC routing — not in CSPR.click connect/sign UI.

There are **three independent root causes**:

| #        | Symptom                                                                                               | Root cause                                                                                                                                                                                          | Severity             |
| -------- | ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| **RC-1** | `Code: -32016, err: Invalid transaction` on Issue Token, Compliance, Staking, all MCP contract writes | MCP/local builders call `ContractCallBuilder.byHash(contract_hash)`; Odra upgradeable packages require `byPackageHash(package_hash)`                                                                | **BLOCKER**          |
| **RC-2** | x402 `Verify failed: invalid_signature` after wallet signs                                            | Server verifies wrong message bytes; Casper Wallet prepends `Casper Message:\n` (official wallet source), server never checks that prefix                                                           | **BLOCKER**          |
| **RC-3** | Intermittent RPC 429 / wrong endpoint                                                                 | `frontend/lib/server/casper-rpc.ts` resolves RPC to `CSPR_SIDE_CAR_URL/rpc` → `https://api.testnet.cspr.cloud/rpc` (Sidecar REST host), not official Node RPC `https://node.testnet.cspr.cloud/rpc` | **HIGH** (secondary) |

Native CSPR transfers (x402 payment tx) **do not** hit RC-1 and can be accepted by RPC when submitted correctly. Contract calls **always** hit RC-1 with the current builder.

---

## Investigation Method

1. Read project bibles: `docs/CASPER_PROTOCOL_BIBLE.md`, `docs/CASPER_DEVELOPER_BIBLE.md`, `docs/MERIDIAN_ENGINEERING_BIBLE.md`, `docs/ARCHITECTURE.md`, `docs/OFFICIAL_REFERENCE_INDEX.md`.
2. Read official CSPR.click signing docs: https://docs.cspr.click/cspr.click-sdk/integration/signing-transactions
3. Compared MERIDIAN builders line-by-line against `casper-js-sdk@5.0.12` `ContractCallBuilder` output and official Casper Wallet `signMessage` source.
4. Ran controlled RPC experiments with Audit Agent PEM (same key as user wallet Account 6: `020257c5a3d8b76c0c5c8a4d12d6100f201e334dc1fbf53a10bccdc8769c59d969fd`).
5. Replayed x402 verify against running local frontend (`localhost:3000`) with simulated wallet signatures.

---

## RC-1: `-32016 Invalid transaction` on Contract Calls

### Root cause

`mcp-server/src/casper/tx-builder.ts` `contractCall()` uses:

```typescript
.byHash(contractHash.replace(/^hash-/, ''))
```

For Odra **contract-package** deployments, the hash stored in `deployed/addresses.json` as `contract_hash` shares the same hex suffix as `package_hash`, but TransactionV1 must target the package:

```json
"target": {
  "Stored": {
    "id": { "ByPackageHash": { "addr": "9bcac97d..." } },
    "runtime": "VmCasperV1"
  }
}
```

Using `ByHash` with that same hex produces a structurally valid signed transaction that the node **rejects at ingress** with RPC error `-32016` (`Invalid transaction`). This is **not** a wallet signature problem.

The local restake fallback in `frontend/src/app/api/mcp/route.ts` repeats the same bug (`.byHash(vaultHash)`).

### Proof (controlled experiment, 2026-07-06)

Same signer, same entry point, same runtime args, same payment — only target selector changed:

| Target method                        | RPC endpoint                                       | Result                                       |
| ------------------------------------ | -------------------------------------------------- | -------------------------------------------- |
| `.byHash(contract_hash)`             | `https://node.testnet.cspr.cloud/rpc` + API key    | **`Code: -32016, err: Invalid transaction`** |
| `.byHash(contract_hash)`             | `https://node.testnet.casper.network/rpc` (public) | **`Code: -32016, err: Invalid transaction`** |
| `.byPackageHash(package_hash)`       | `https://node.testnet.cspr.cloud/rpc` + API key    | **Accepted — transaction hash returned**     |
| `NativeTransferBuilder` (x402-style) | Both RPC endpoints above                           | **Accepted**                                 |

**Payload diff (MeridianToken `transfer`, same args):**

| Field              | `byHash` (rejected)                                                                | `byPackageHash` (accepted)                                                                            |
| ------------------ | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `target.Stored.id` | `{ "ByHash": "9bcac97d0e6723049fc130daa22f69e88a5d077a1df6b4e38536f0703bcaa2ca" }` | `{ "ByPackageHash": { "addr": "9bcac97d0e6723049fc130daa22f69e88a5d077a1df6b4e38536f0703bcaa2ca" } }` |

### Successful on-chain submission (proof hash)

After switching to `byPackageHash` only in a diagnostic script (not in app code):

| Flow                                 | Transaction hash                                                   | Explorer                                                                                          |
| ------------------------------------ | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| Issue Token (`transfer` entry point) | `e18a096a9f0dde8f5f8851eaadc80906f0abf51bf08afbf6ab124523b378837e` | https://testnet.cspr.live/deploy/e18a096a9f0dde8f5f8851eaadc80906f0abf51bf08afbf6ab124523b378837e |

This proves: **sign → serialize → RPC accept** works once the target is `ByPackageHash`.

### Official references

- `casper-js-sdk@5.0.12` `ContractCallBuilder` docs list both `.byHash()` and `.byPackageHash()` — for upgradeable Odra packages, `.byPackageHash()` resolves the active contract version.
- MERIDIAN `docs/OFFICIAL_REFERENCE_INDEX.md` — Node RPC: `https://node.testnet.cspr.cloud/rpc`
- Deployed packages (`deployed/addresses.json`):

| Contract           | Package hash                                                                        |
| ------------------ | ----------------------------------------------------------------------------------- |
| MeridianToken      | `contract-package-9bcac97d0e6723049fc130daa22f69e88a5d077a1df6b4e38536f0703bcaa2ca` |
| StakingVault       | `contract-package-3062ba32a4ef4d3fd0fc5c9d0895980b7bbbcc5f407590d1b14c60ca631300c7` |
| ComplianceRegistry | `contract-package-e6ed2d2eb8a1ffc7aa55a4158643a3682493d6f15f1e7123113a9c8534ee84f8` |

### Why the previous implementation failed

- MCP `TransactionBuilder.contractCall()` always strips `hash-` and calls `.byHash()`.
- Frontend submits wallet-signed JSON faithfully via `Transaction.fromJSON()` → `putTransaction()` — serialization is not corrupted; the **unsigned template is wrong before signing**.
- Wallet opens and user signs because the transaction JSON is well-formed; the node rejects it at submission.

### Affected flows

All MCP write tools using `contractCall()`:

- `issue_token`, `transfer_token`, `register_holder`, `revoke_holder`, `restake`, `distribute_rewards`
- Frontend restake fallback in `frontend/src/app/api/mcp/route.ts`

### Product note (separate from RC-1)

`buildIssueToken()` calls MeridianToken entry point **`transfer`** (self-transfer template), not mint/issue. Fixed supply was minted at deploy (`deploy_MeridianToken` hash `ca4c4b96e6cf5638633b3123d5e54397b611256d656eea19938b5eb4493fcc74`). Even after RC-1 fix, `transfer` may revert on-chain if compliance preconditions fail (holder not registered / not compliant) — that would be an **execution revert**, not `-32016`.

---

## RC-2: x402 `invalid_signature`

### Root cause

Frontend (`frontend/lib/x402.ts`) builds authorization and calls:

```typescript
const digestHex = await hashAuthorization(authorization, domain)
const authSign = await clickRef.signMessage(digestHex, publicKey)
```

Server (`frontend/lib/server/x402-auth.ts`, `x402-facilitator/src/facilitator-service.ts`) verifies signatures against:

- Raw SHA-256 digest bytes (`Buffer.from(digestHex, 'hex')`)
- UTF-8 of `digestHex` string
- UTF-8 of canonical JSON

**None** of these match what **Casper Wallet** actually signs.

Official Casper Wallet source (`make-software/casper-wallet`, `src/libs/crypto/sign-message.tsx`):

```typescript
export const CASPER_MESSAGE_HEADER = `Casper Message:\n`

export const createMessageBytesWithHeaders = (message: string): Uint8Array => {
  const messageWithHeader = `${CASPER_MESSAGE_HEADER}${message}`
  return Uint8Array.from(Buffer.from(messageWithHeader))
}

// Wallet signs UTF-8 bytes of "Casper Message:\n" + message
const signature = privateKey.sign(messageHash)
// Provider response prepends algorithm byte for verifySignature
```

Verification must use:

```typescript
Buffer.from(`Casper Message:\n${digestHex}`, 'utf8')
```

### Proof (controlled experiment, 2026-07-06)

Using Audit Agent key, simulate wallet `signMessage(digestHex)` exactly per Casper Wallet source:

| Verification message bytes                             | Matches wallet signature? |
| ------------------------------------------------------ | ------------------------- |
| Raw digest (`Buffer.from(digestHex, 'hex')`)           | **NO**                    |
| UTF-8 of hex string (`Buffer.from(digestHex, 'utf8')`) | **NO**                    |
| **`Casper Message:\n` + digestHex (UTF-8)**            | **YES**                   |

**Live API replay against `http://localhost:3000/api/x402/verify`:**

| Signature style                                                     | POST `/api/x402/verify` result                      |
| ------------------------------------------------------------------- | --------------------------------------------------- |
| PEM `signAndAddAlgorithmBytes(raw digest)` (facilitator simulation) | `{ "valid": true }`                                 |
| Wallet-style (`Casper Message:\n` + digestHex)                      | `{ "valid": false, "reason": "invalid_signature" }` |

This exactly reproduces the user screenshot failure.

### Why the previous implementation failed

- `x402-facilitator` `buildSignedPayment()` signs with `signAndAddAlgorithmBytes(Buffer.from(digestHex, 'hex'))` — valid for **server-side PEM**, invalid for **browser Casper Wallet `signMessage`**.
- Frontend correctly reaches wallet and collects `signatureHex`, but server verifies the wrong byte string.
- Native transfer signing (`clickRef.sign(transaction.toJSON())`) is a separate step and is not the source of `invalid_signature` — verify fails on the **authorization** signature before settle.

### Official references

- Casper Wallet: https://github.com/make-software/casper-wallet/blob/HEAD/src/libs/crypto/sign-message.tsx
- Casper Wallet tests: https://github.com/make-software/casper-wallet/blob/HEAD/src/libs/crypto/sign-message.test.ts
- CSPR.click SDK exposes `signMessage(message: string, signingPublicKey: string)` — passes string through to wallet provider without adding headers (wallet adds them).
- MERIDIAN `docs/CASPER_DEVELOPER_BIBLE.md` §9 specifies production x402 should use **EIP-712 + `casper-eip-712` + `transfer_with_authorization`** (`odradev/casper-x402-poc`). Current MERIDIAN shortcut (SHA-256 + `signMessage`) diverges from both the official x402 spec **and** Casper Wallet message semantics.

### x402 payment destination (verified — not the verify failure)

Default pay-to account hash `account-hash-267bc977600c9512c0ce5e96af4d0057d514998cc752e28b8f5e91b654a72c27` matches deployer public key `0203d64d1b7f66f1...` (Account 1 in Casper Wallet). UI tag `...a72c27` and wallet recipient `0203d...` refer to the same deployer account; verify fails **before** settlement checks transfer recipient.

---

## RC-3: RPC URL Misconfiguration (Secondary)

### Root cause

`frontend/lib/server/casper-rpc.ts`:

```typescript
const sidecar = process.env.CSPR_SIDE_CAR_URL?.replace(/\/$/, '')
if (sidecar) return `${sidecar}/rpc` // → https://api.testnet.cspr.cloud/rpc
```

Per MERIDIAN `docs/OFFICIAL_REFERENCE_INDEX.md`:

| Service              | Correct URL                                                       |
| -------------------- | ----------------------------------------------------------------- |
| **Node JSON-RPC**    | `https://node.testnet.cspr.cloud/rpc`                             |
| **Sidecar REST/SSE** | `https://api.testnet.cspr.cloud` (no `/rpc` for `putTransaction`) |

Appending `/rpc` to the Sidecar REST base is incorrect. During investigation, `api.testnet.cspr.cloud/rpc` returned **HTTP 429** under load while `node.testnet.cspr.cloud/rpc` accepted transactions.

RC-3 is **not** the cause of `-32016` on contract calls (RC-1 reproduces on both public node and correct node RPC). RC-3 can still cause submit failures, rate limits, and misleading errors after RC-1/RC-2 are fixed.

### Official references

- CSPR.cloud Node RPC: https://node.testnet.cspr.cloud/rpc (also listed in `docs/OFFICIAL_REFERENCE_INDEX.md`)
- CSPR.click recommends `clickRef.send()` which uses CSPR.click’s RPC proxy — MERIDIAN currently uses custom `sign()` + server `putTransaction()` (`frontend/lib/hooks/useWalletActions.ts`).

---

## End-to-End Pipeline Verification

| Stage                                  | Issue Token / Staking         | x402                          |
| -------------------------------------- | ----------------------------- | ----------------------------- |
| Wallet connection                      | ✅ Works                      | ✅ Works                      |
| Wallet signature                       | ✅ Works                      | ✅ Works (auth + transfer)    |
| Transaction / auth construction        | ❌ RC-1 wrong `ByHash` target | ❌ RC-2 wrong verify bytes    |
| Serialization (`Transaction.fromJSON`) | ✅ Wallet + SDK compatible    | ✅ Transfer tx OK             |
| RPC submission                         | ❌ `-32016` (RC-1)            | N/A at verify step            |
| Authorization verify                   | N/A                           | ❌ `invalid_signature` (RC-2) |
| Explorer hash                          | ❌ Blocked by RC-1            | ❌ Blocked by RC-2            |

---

## Files Requiring Fix (Not Modified in This Investigation)

| File                                          | Change required                                                                                 |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `mcp-server/src/casper/tx-builder.ts`         | Replace `.byHash()` with `.byPackageHash()` using `package_hash` from `deployed/addresses.json` |
| `frontend/src/app/api/mcp/route.ts`           | Restake fallback: same package-hash targeting                                                   |
| `frontend/lib/server/x402-auth.ts`            | Add `Casper Message:\n` message candidate (or migrate to EIP-712 per bible)                     |
| `x402-facilitator/src/facilitator-service.ts` | Same wallet message header in `messageVariants()`                                               |
| `frontend/lib/server/casper-rpc.ts`           | Default to `https://node.testnet.cspr.cloud/rpc`, not `CSPR_SIDE_CAR_URL/rpc`                   |
| `frontend/lib/x402.ts`                        | Optional: pass human-readable message to wallet; must match server verify bytes                 |

### Before vs After (expected)

|                      | Before                                 | After (expected)                                         |
| -------------------- | -------------------------------------- | -------------------------------------------------------- |
| Contract call target | `ByHash` → RPC `-32016`                | `ByPackageHash` → deploy hash + explorer link            |
| x402 verify          | PEM-only signatures pass; wallet fails | Wallet `signMessage` signatures pass                     |
| RPC URL              | Sidecar REST + `/rpc`                  | Official Node RPC + Authorization header                 |
| CSPR.click flow      | Custom `sign()` + server submit        | Consider official `send()` per docs (optional hardening) |

---

## Transactions Executed Successfully During Investigation

These were submitted via diagnostic scripts using correctly constructed TransactionV1 (not via the broken UI path):

| Label                                      | Hash                                                               | Explorer                                                                                          |
| ------------------------------------------ | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| Issue Token `transfer` via `byPackageHash` | `e18a096a9f0dde8f5f8851eaadc80906f0abf51bf08afbf6ab124523b378837e` | https://testnet.cspr.live/deploy/e18a096a9f0dde8f5f8851eaadc80906f0abf51bf08afbf6ab124523b378837e |

No UI-driven end-to-end flows completed successfully yet — blocked by RC-1 and RC-2 in production code paths.

---

## Remaining Blockers After RC-1 + RC-2 Fixes

1. **Restake on-chain execution** — requires `VALIDATOR_CURATOR` role and valid validator keys; MCP input schema rejects some validator public keys starting with `01` (local fallback exists but shares RC-1 bug).
2. **Issue Token semantics** — `transfer` self-transfer does not mint new tokens; product may need different entry point or UX copy.
3. **Compliance preconditions** — `MeridianToken.transfer` enforces compliant registered holders; may revert post-submit even when RPC accepts transaction.
4. **EIP-712 alignment** — long-term x402 should match `odradev/casper-x402-poc` + `casper-eip-712`, not custom SHA-256 authorization.
5. **Rate limiting** — use Node RPC with API key; avoid Sidecar REST `/rpc` conflation.

---

## GitHub / External References

| Reference                         | URL                                                                                                                                                                   |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Casper Wallet sign-message        | https://github.com/make-software/casper-wallet/blob/HEAD/src/libs/crypto/sign-message.tsx                                                                             |
| casper-js-sdk ContractCallBuilder | `node_modules/casper-js-sdk/site/pages/builders/ContractCallBuilder.mdx`                                                                                              |
| CSPR.click signing transactions   | https://docs.cspr.click/cspr.click-sdk/integration/signing-transactions                                                                                               |
| MERIDIAN x402 bible (EIP-712)     | `docs/CASPER_DEVELOPER_BIBLE.md` §9                                                                                                                                   |
| odradev casper-x402-poc           | https://github.com/odradev/casper-x402-poc                                                                                                                            |
| RPC error `-32016`                | Casper JSON-RPC `Invalid transaction` — returned at transaction ingress when structure/target is invalid (observed consistently with `ByHash` on package deployments) |

---

## Recommended Fix Order

1. **RC-1** — `byPackageHash` in MCP tx-builder + restake fallback (unblocks all contract writes).
2. **RC-2** — Add `Casper Message:\n${digestHex}` to server verify message candidates (unblocks x402 verify/settle in browser).
3. **RC-3** — Fix Node RPC URL in `casper-rpc.ts`.
4. Re-test all flows: Issue Token, Register Holder, Compliance, Stake, Restake, x402, every MCP write tool — each must produce deploy hash, explorer link, backend/indexer update.
5. Plan EIP-712 x402 migration per `CASPER_DEVELOPER_BIBLE.md` for production parity with Casper AI Toolkit facilitator.

---

## Conclusion

The wallet is not the problem. **Two deterministic bugs** in MERIDIAN code explain all reported failures:

1. **Contract calls target `ByHash` instead of `ByPackageHash`** → RPC `-32016` after sign.
2. **x402 verify omits Casper Wallet’s `Casper Message:\n` prefix** → `invalid_signature` after sign.

Both are proven with reproducible experiments, official SDK/wallet source citations, and a live on-chain transaction hash. No code was changed during this investigation; apply fixes in the order above and re-run the full flow loop.

---

## Fix Implementation (2026-07-06)

**Status:** All three root causes fixed and verified locally.

### Files changed

| File                                                | Change                                                              |
| --------------------------------------------------- | ------------------------------------------------------------------- |
| `mcp-server/src/casper/tx-builder.ts`               | `contractCall()` uses `.byPackageHash()` with `package_hash`        |
| `mcp-server/tests/unit/tx-builder.test.ts`          | Asserts `ByPackageHash` in transaction payload                      |
| `frontend/lib/server/mcp-write-builder.ts`          | **New** — local write-tool builder (fixed tx) for browser MCP route |
| `frontend/src/app/api/mcp/route.ts`                 | Write tools built locally; read tools still proxy to remote MCP     |
| `frontend/lib/server/x402-auth.ts`                  | Verifies `Casper Message:\n${digestHex}` wallet signatures          |
| `x402-facilitator/src/facilitator-service.ts`       | Same wallet message header in verify                                |
| `frontend/lib/server/casper-rpc.ts`                 | Node RPC URL default; `formatTransactionHash()` helper              |
| `frontend/src/app/api/transactions/submit/route.ts` | Proper hash string in API response                                  |
| `frontend/lib/server/x402-local.ts`                 | Proper hash string on settle                                        |

### Verification results (post-fix)

| Flow                                            | Result                                                                            |
| ----------------------------------------------- | --------------------------------------------------------------------------------- |
| MCP `issue_token` API                           | Returns `ByPackageHash` target (not `ByHash`)                                     |
| `POST /api/transactions/submit` (issue_token)   | **200** — hash `44042e25062747f8ec5bac94773793075600e9b5414581a6673e401bad3150c9` |
| `POST /api/x402/verify` (wallet-style sig)      | `{ "valid": true }`                                                               |
| `GET /api/x402/resource/yield-rate` + X-Payment | **200** — paid resource unlocked + settlement                                     |
| MCP unit tests                                  | **4/4 pass**                                                                      |
| x402 facilitator unit tests                     | **5/5 pass**                                                                      |

### Post-fix transaction hashes

| Label                                        | Hash                                                               | Explorer                                                                                          |
| -------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| Issue Token (investigation)                  | `e18a096a9f0dde8f5f8851eaadc80906f0abf51bf08afbf6ab124523b378837e` | https://testnet.cspr.live/deploy/e18a096a9f0dde8f5f8851eaadc80906f0abf51bf08afbf6ab124523b378837e |
| Issue Token (via `/api/transactions/submit`) | `44042e25062747f8ec5bac94773793075600e9b5414581a6673e401bad3150c9` | https://testnet.cspr.live/deploy/44042e25062747f8ec5bac94773793075600e9b5414581a6673e401bad3150c9 |

### Deploy note

Remote Render MCP (`meridian-mcp-server-94q4.onrender.com`) still serves pre-fix `ByHash` transactions until redeployed. The frontend `/api/mcp` route now builds **all write tools locally** with the fixed builder, so browser flows do not depend on remote MCP for transaction construction.

### Remaining non-blockers

1. **Restake on-chain** — still requires `VALIDATOR_CURATOR` role; RPC accept ≠ execution success.
2. **Issue Token semantics** — `transfer` self-transfer template; compliance may revert on execution.
3. **Render MCP redeploy** — recommended so direct MCP HTTP clients also get `ByPackageHash`.
4. **EIP-712 x402** — long-term alignment with `casper-eip-712` per bible §9.
