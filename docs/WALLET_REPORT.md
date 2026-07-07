# Wallet Integration Report

## Provider detection

| Provider                      | Detection                        | Sign API                               | Status           |
| ----------------------------- | -------------------------------- | -------------------------------------- | ---------------- |
| `window.CasperWalletProvider` | `casperWalletDirect.ts`          | `provider.sign(deployJson, publicKey)` | VERIFIED in code |
| CSPR.click SDK                | `resolveWalletSigner()` fallback | `clickRef.sign()`                      | VERIFIED in code |

Mode selection: `preferDirectCasperWallet()` in `walletMode.ts`.

## Connection flow

```
LandingWalletButton / useWalletActions.connect()
  → connectCasperWallet(clickRef)
  → CasperWalletProvider.requestConnection()
  → getActivePublicKey() cached
```

Connected wallet in screenshot: `020257c5a3…59d969fd` — matches audit test key.

## Sign + submit flow

```typescript
// useWalletActions.ts
signAndSubmit(unsigned) {
  signer.sign(transaction.transaction, publicKey)
  submitSignedTransaction(signed.transaction)  // POST /api/transactions/submit
}
```

| Check                 | Result   | Notes                                                           |
| --------------------- | -------- | --------------------------------------------------------------- |
| Wallet popup on write | PENDING  | Requires browser; popup triggered by `sign()` after unsigned tx |
| Site approval errors  | HANDLED  | Reconnect flow on "not approved"                                |
| Locked wallet         | HANDLED  | User message: "Unlock Casper Wallet"                            |
| Rejected sign         | HANDLED  | Throws `Wallet rejected signing`                                |
| deploy() vs sign()    | sign()   | Uses TransactionV1 JSON via Casper Wallet sign API              |
| broadcast() in wallet | NOT USED | App broadcasts via RPC after sign (correct pattern)             |

## Account hash derivation

```typescript
// accountHashFromPublicKey
PublicKey.fromHex(pk).accountHash().toPrefixedString()
```

Test wallet account hash: `account-hash-d73864646338c6fef8649847103f8c7c6fd877433866bc059acd95a0548cc216`

Passed to planner as `callerAccountHash` for register/compliance flows.

## Why wallet popup may not appear

| Cause                       | Symptom                        | Fix                                       |
| --------------------------- | ------------------------------ | ----------------------------------------- |
| Read-only mission           | No unsigned tx                 | Expected — pipeline shows "Read complete" |
| Planner failed before write | Error phase                    | Fix planner (register/transfer)           |
| Wallet not connected        | `getPublicKey()` null          | Connect wallet first                      |
| No TransactionReviewCard    | User didn't reach wallet phase | Execute write mission                     |
| Unsigned tx missing         | Backend 422                    | Deploy tx-builder + planner fixes         |

## Verification checklist (manual)

1. Connect Casper Wallet on https://meridian-frontend-kappa.vercel.app/agent
2. Run `Delegate stake 500 CSPR`
3. Confirm TransactionReviewCard appears
4. Click Sign — wallet popup must open
5. Approve — tx hash appears in TransactionStatus
6. Explorer link opens testnet.cspr.live

## Permissions

- Casper Wallet site connection required (`requestConnection`)
- No automatic sign — user must approve each write (by design)
