# Explorer Report

## URL format

```typescript
// frontend/lib/contracts.ts
explorerTxUrl(hash) → `https://testnet.cspr.live/deploy/${hash}`
explorerAccountUrl(accountHash) → `https://testnet.cspr.live/account/...`
```

## Required fields after successful write

| Field            | Source                                           | When shown                         |
| ---------------- | ------------------------------------------------ | ---------------------------------- |
| Transaction hash | `submitSignedTransaction()` response             | After wallet sign + broadcast      |
| Explorer URL     | `explorerTxUrl(txHash)`                          | Only when `txHash` is non-null     |
| Network          | `unsignedTx.network` / `casper-test`             | TransactionReviewCard              |
| Timestamp        | RPC / status poll                                | TransactionStatus (when available) |
| Block height     | Status API                                       | `getTransactionPollResult`         |
| Gas              | Transaction payment field                        | In unsigned tx JSON                |
| Execution result | Status poll `processed` / `finalized` / `failed` | TransactionStatus chips            |

## UI rules (post-fix)

| Rule                                | Implementation                                                                                 |
| ----------------------------------- | ---------------------------------------------------------------------------------------------- |
| Never show Explorer without tx hash | `AgentPipeline` explorer stage `pending` until `txHash`                                        |
| Never fake confirmation             | `confirmed` stage requires `txHash` + finality trace or `phase === 'complete'` after broadcast |
| Failed execution                    | `error` phase shows "Execution failed" + exact message                                         |
| Read missions                       | Write chain stages skipped entirely                                                            |

## Components

- `TransactionStatus.tsx` — polls status, shows explorer link when hash present
- `TransactionReviewCard.tsx` — pre-sign review with network + note
- `AgentPipeline.tsx` — explorer link in accordion only if `txHash`
- `LandingWalletButton.tsx` — account explorer link for connected wallet

## Status polling

```
GET /api/transactions/status/:hash
  → getTransactionPollResult()
  → returns { status: pending | processed | finalized | failed, detail? }
```

Poll interval: 4s, max 30 attempts (`pollTransactionStatus`).

## Example (after successful delegate)

```
Transaction hash: <64-char hex>
Explorer: https://testnet.cspr.live/deploy/<hash>
Network: casper-test
```

## Current production gap

Explorer links cannot appear until:

1. User signs unsigned tx in browser
2. `/api/transactions/submit` returns hash
3. `TransactionStatus` receives hash

Automated API tests stop at unsigned tx — explorer is **correctly absent** until wallet step completes.

## Deployed contract explorers

From `addresses.json` — each contract has `explorer_url` for judge verification of deployed bytecode.
