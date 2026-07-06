# MERIDIAN — Full Project & Deployment Summary

**Last updated:** July 6, 2026  
**Repository:** [github.com/mohamedwael201193/MERIDIAN](https://github.com/mohamedwael201193/MERIDIAN)

---

## 1. What MERIDIAN Is

MERIDIAN is a **Casper-native Real World Asset (RWA) protocol** on **Casper testnet**. It combines:

| Layer                           | Purpose                                                                          |
| ------------------------------- | -------------------------------------------------------------------------------- |
| **Smart contracts (Odra/Rust)** | Token (MRWA), compliance registry, staking vault, yield distributor, audit log   |
| **Backend (Fastify)**           | Indexer-facing API, holder/compliance/yield data, health checks                  |
| **Frontend (Next.js)**          | Dashboard, issue token, staking, compliance, AI agents, MCP tools, x402 payments |
| **MCP server**                  | Builds unsigned Casper transactions for wallet signing (12 tools)                |
| **x402 facilitator**            | Native CSPR micropayments for premium API resources                              |
| **AI agents**                   | Yield, compliance, and audit agents (multi-provider LLM)                         |

Deployed contracts live in `deployed/addresses.json` (network: `casper-test`).

---

## 2. Live URLs (Production)

| Service              | URL                                            | Host   |
| -------------------- | ---------------------------------------------- | ------ |
| **Frontend**         | https://meridian-frontend-kappa.vercel.app     | Vercel |
| **Backend API**      | https://meridian-backend-ikx8.onrender.com     | Render |
| **MCP server**       | https://meridian-mcp-server-94q4.onrender.com  | Render |
| **x402 facilitator** | https://meridian-x402-facilitator.onrender.com | Render |
| **Block explorer**   | https://testnet.cspr.live                      | Casper |

Render service IDs (for env sync script):

- `meridian-backend`: `srv-d93aj1ernols73b8a170`
- `meridian-mcp-server`: `srv-d90sq73sq97s739mnm10`
- `meridian-x402`: `srv-d90sq66q1p3s738jap8g`

---

## 3. Architecture Flow

```
Browser (Vercel Next.js)
  ├── Connect Wallet → Casper Wallet extension (direct or CSPR.click)
  ├── /api/* routes → proxy to Render backend (X-API-Key)
  ├── /api/mcp → local builder OR remote MCP server
  ├── /api/x402/* → 402 payment flow + settlement
  └── /api/transactions/status → Casper RPC (info_get_transaction)

Render backend → Supabase + CSPR.cloud indexer
Render MCP → builds unsigned txs from contract addresses
Render x402 → verifies/settles CSPR transfer authorizations
Casper testnet → executes signed deploys/transfers
```

---

## 4. Wallet Connection — How It Works

### Problem (original)

On **Vercel production**, “Connect Wallet” failed because:

1. CSPR.click iframe requires a registered app ID and whitelisted domain.
2. Without it, the iframe returned **401** and no wallet popup appeared.
3. Localhost worked with the csprclick template; production did not.

### Solution

**Dual wallet path** in `frontend/lib/wallet/`:

1. **Production with `NEXT_PUBLIC_CSPRCLICK_APP_ID`**  
   Uses CSPR.click SDK (`ClickProviderWrapper`) — official provider selector.

2. **Fallback: direct Casper Wallet** (`preferDirectCasperWallet()`)  
   Calls `window.CasperWalletProvider` directly:
   - `connectDirectCasperWallet()` → extension popup → public key stored in session
   - `walletSigner.ts` signs deploys/transfers via the same provider
   - Used when no CSPR.click app ID or on Vercel before app registration

**Registered CSPR.click app:**

- App ID: `f30e2421-6f48-42cb-bb82-1dec4ca3`
- Domains: `meridian-frontend-kappa.vercel.app`, `localhost`
- Network: Casper Test
- RPC whitelist: `query_balance`, `state_get_account_info`, `info_get_transaction`, `chain_get_state_root_hash`, `query_global_state`

> **Note:** `019f0f1b-c03e-7273-b63f-8e877947a653` is the **CSPR.cloud API key**, not the CSPR.click app ID.

### Sign & submit flow

1. User clicks **Build via MCP** → `POST /api/mcp` with tool name + args.
2. MCP returns **unsigned transaction** JSON.
3. UI shows **TransactionReviewCard** (“Wallet signature required”).
4. User clicks **Sign & Submit** → `wallet.signAndSubmit(unsignedTx)`:
   - Casper Wallet popup shows action (transfer, restake, etc.).
   - User clicks **Sign** in extension.
5. Signed tx submitted via `POST /api/transactions/submit` → RPC → returns **transaction hash**.
6. **TransactionStatus** polls `/api/transactions/status/{hash}` until finalized or failed.

Private keys never leave the Casper Wallet extension.

---

## 5. Deployment Timeline & Fixes

### Phase A — Vercel frontend could not reach backend

| Symptom                         | Cause                                           | Fix                                                                       |
| ------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------- |
| “Backend unavailable” on Vercel | Missing `MERIDIAN_API_KEY`, wrong `BACKEND_URL` | Set env vars on Vercel via CLI; proxy in `frontend/lib/server/backend.ts` |

### Phase B — Connect Wallet broken on Vercel

| Symptom         | Cause                         | Fix (commit `192f6b0`)                                         |
| --------------- | ----------------------------- | -------------------------------------------------------------- |
| No wallet popup | CSPR.click 401 without app ID | Direct Casper Wallet fallback; skip iframe when not configured |

### Phase C — `/api/mcp` returned 500 HTML

| Symptom                   | Cause                                                             | Fix (commit `207f5cc`)                                                     |
| ------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------------------- |
| MCP build fails on Vercel | Top-level import of `mcp-write-builder` crashed serverless bundle | Lazy `import()` in route; remote MCP fallback; `outputFileTracingIncludes` |

### Phase D — Render backend deploy crash (ENOENT)

| Symptom               | Cause                                               | Fix (commit `e236303`)                                                                                                             |
| --------------------- | --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Backend `/ready` down | `deployed/addresses.json` not found at runtime path | `resolveContractsPath()` with multiple candidates; copy into `dist/deployed/` on build; `scripts/start-backend.sh` walks repo root |

### Phase E — Blockchain transaction builder bugs

| Symptom                         | Cause                                                       | Fix                                                       |
| ------------------------------- | ----------------------------------------------------------- | --------------------------------------------------------- |
| Contract calls failed on-chain  | `.byHash()` instead of `.byPackageHash()` in MCP tx builder | Fixed in `mcp-server/src/casper/tx-builder.ts`            |
| x402 verify rejected signatures | Missing `Casper Message:\n` prefix                          | Fixed in `frontend/lib/server/x402-auth.ts` + facilitator |
| Wrong RPC endpoint              | Malformed Node RPC URL                                      | Fixed in `frontend/lib/server/casper-rpc.ts`              |

### Phase F — UI “pending” forever + x402 JSON error (this session)

| Symptom                                                 | Cause                                                                                  | Fix                                                                                                |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Tx stuck **pending** though on-chain (incl. failed)     | Status route used wrong Casper 2.x RPC response shape; catch always returned `pending` | New `casper-transaction-status.ts` using `info_get_transaction` + Version2 `error_message` parsing |
| Stepper showed **Confirmed** while still pending/failed | `activeStep=3` as soon as hash existed                                                 | Token issue form waits for `finalized` before step 4                                               |
| x402: `Unexpected token '<', "<!DOCTYPE "...`           | `/api/x402/resource/yield-rate` crashed (500 HTML) on module import                    | Lightweight `x402-config.ts` for 402 response; dynamic import for settle; content-type check in UI |
| Misleading generic error text                           | Frontend called `.json()` on HTML error pages                                          | Clear message when server returns HTML instead of JSON                                             |

### Phase G — Prevent failing wallet popups + fix Vercel Casper SDK bundle

| Symptom                                                               | Cause                                                                                             | Fix                                                                                                                |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| x402 after wallet approval: `Cannot find module casper-js-sdk`        | Next.js externalized `casper-js-sdk` / the workspace Casper wrapper from Vercel serverless output | Removed `serverExternalPackages`; `x402-auth` now verifies signatures through direct `casper-js-sdk` loading       |
| Issue Token opened wallet then failed `User error: 31003`             | `issue_token` was a self-transfer placeholder; MRWA has fixed supply minted at deployment         | Disabled issue signing in UI and MCP; page now explains the token is already deployed                              |
| Staking opened curator-only `restake` then failed `User error: 20003` | User-facing staking panel called `restake`, but the contract requires `VALIDATOR_CURATOR_ROLE`    | Added `delegate_stake` MCP tool using Casper native delegation; `restake` remains available only for curator flows |

---

## 6. On-Chain Transactions You Ran (July 6, 2026)

These **did reach testnet** but **execution failed** — not a UI-only issue:

| Action                               | Hash (short)     | Explorer result                                                                |
| ------------------------------------ | ---------------- | ------------------------------------------------------------------------------ |
| Issue token (self-transfer template) | `1e585d9c…c5656` | **User error: 31003** — transfer template, not a real token deploy             |
| Restake                              | `17be2f13…b8de6` | **User error: 20003** — likely missing **CURATOR** role or invalid stake state |

After the status-polling fix, the UI now shows **`failed`** with the on-chain error message instead of infinite **pending**.

**Remaining contract-level work (not UI):**

- `issue_token` is now disabled because MRWA fixed supply was minted at deployment.
- `restake` still requires the caller to hold **CURATOR** role on StakingVault — grant role or use the curator account for operator demos.
- Normal user staking now uses `delegate_stake` (native Casper delegation), which is separate from curator restake.

---

## 7. Staking Yield History — Why Empty

The dashboard chart (**Staking Activity / Era rewards**) reads:

```
GET /api/yields/history → backend /api/v1/yields/history
```

Both return **`{"data":[]}`** today because:

- The backend indexer has **not yet recorded any YieldDistributor reward events** on testnet.
- No successful `distribute_rewards` / era settlement has been indexed for MRWA.

The UI correctly shows: _“No yield history indexed yet.”_  
This is **expected until** a curator runs reward distribution and the indexer ingests those events.

---

## 8. x402 Payments Flow

1. **Request (expect 402)** → `GET /api/x402/resource/yield-rate` without `X-Payment` header.
2. Server returns **402 JSON** with payment requirements (amount, pay-to account hash, network).
3. User **Sign Payment** → Casper Wallet signs transfer authorization.
4. **Verify** → `POST /api/x402/verify` checks signature + message prefix.
5. **Settle** → submits transfer to Casper RPC.
6. **Access** → paid resource data unlocked.

Env vars (Vercel):

- `X402_PAYMENT_AMOUNT_MOTES`, `X402_PAY_TO_ACCOUNT_HASH`
- `X402_FACILITATOR_URL` → Render facilitator
- `CASPER_CHAIN_NAME` / `NEXT_PUBLIC_CASPER_NETWORK` → `casper-test`

---

## 9. Environment Variables

### Vercel (frontend) — required

| Variable                                 | Purpose                                                |
| ---------------------------------------- | ------------------------------------------------------ |
| `MERIDIAN_API_KEY`                       | Authenticates proxy calls to Render backend            |
| `BACKEND_URL` / `BACKEND_URL_PRODUCTION` | Render backend base URL                                |
| `MERIDIAN_MCP_URL`                       | Remote MCP on Render                                   |
| `X402_FACILITATOR_URL`                   | x402 facilitator on Render                             |
| `CASPER_NODE_RPC_URL` / `CASPER_RPC_URL` | Casper testnet RPC                                     |
| `CSPR_CLOUD_AUTH_TOKEN`                  | CSPR.cloud / RPC auth                                  |
| `NEXT_PUBLIC_CSPRCLICK_APP_ID`           | CSPR.click wallet (`f30e2421-6f48-42cb-bb82-1dec4ca3`) |
| `NEXT_PUBLIC_CASPER_NETWORK`             | `casper-test`                                          |
| `X402_*`                                 | Payment amount and pay-to address                      |

### Render (backend, MCP, x402) — required

| Variable                  | Purpose                             |
| ------------------------- | ----------------------------------- |
| `MERIDIAN_API_KEY`        | API auth (same key as Vercel)       |
| `DATABASE_URL` / Supabase | Indexer storage                     |
| `CSPR_CLOUD_*`            | Indexer / RPC                       |
| Cross-service URLs        | Each service knows the others’ URLs |

**Render does NOT need** `NEXT_PUBLIC_*` vars.

Sync script: `node scripts/render-env-sync.mjs` (uses `render_api_key` from local `.env`).

---

## 10. Git Commits (Recent, `main`)

| Commit          | Description                                          |
| --------------- | ---------------------------------------------------- |
| `192f6b0`       | Casper Wallet direct connect on Vercel               |
| `207f5cc`       | MCP lazy load + Render env sync                      |
| `e236303`       | `addresses.json` path fix for Render                 |
| `650e82d`       | CSPR.click app ID documentation                      |
| _(this deploy)_ | Transaction status polling, x402 402 fix, stepper UX |

---

## 11. How to Redeploy

### Push code (GitHub)

```bash
git push origin main
```

Vercel auto-deploys if the GitHub integration is connected.

### Manual Vercel redeploy

```bash
vercel --prod --cwd frontend   # uses vercel_token from .env
```

### Render env + redeploy

```bash
node scripts/render-env-sync.mjs
```

---

## 12. Verification Checklist (Post-Deploy)

- [ ] https://meridian-frontend-kappa.vercel.app shows **Backend ok**
- [ ] Connect Wallet → Casper Wallet popup → balance visible
- [ ] Failed tx hash returns `{ "status": "failed", "detail": "User error: …" }` from `/api/transactions/status/{hash}`
- [ ] x402 **Request** returns **402 JSON** (not 500 HTML)
- [ ] Backend `/ready` → 200 on Render
- [ ] Yield history empty state message (until rewards indexed)

---

## 13. Key Files Reference

| Area                  | Path                                                                         |
| --------------------- | ---------------------------------------------------------------------------- |
| Wallet connect        | `frontend/lib/wallet/connectCasperWallet.ts`, `casperWalletDirect.ts`        |
| MCP API               | `frontend/src/app/api/mcp/route.ts`                                          |
| Tx status             | `frontend/lib/server/casper-transaction-status.ts`                           |
| x402                  | `frontend/lib/server/x402-config.ts`, `x402-local.ts`, `X402PaymentFlow.tsx` |
| Backend proxy         | `frontend/lib/server/backend.ts`                                             |
| Contract addresses    | `deployed/addresses.json`                                                    |
| Render scripts        | `scripts/render-env-sync.mjs`                                                |
| Block explorer report | `docs/reports/BLOCKCHAIN_TRANSACTION_ROOT_CAUSE_REPORT.md`                   |

---

## 14. Summary of What Was Solved

1. **Vercel ↔ Render connectivity** — API key and backend URL env vars.
2. **Wallet on production** — Direct Casper Wallet + CSPR.click app registration.
3. **MCP on serverless** — Lazy imports and bundle tracing.
4. **Render backend boot** — Bundled `addresses.json` resolution.
5. **Transaction builder** — Package hash targeting for contract calls.
6. **x402 signature verify** — Casper Message header prefix.
7. **RPC URL** — Correct testnet node endpoint.
8. **Pending UI bug** — Proper Casper 2.x execution result parsing.
9. **x402 HTML/JSON error** — Lightweight 402 route + safe client parsing.
10. **Stepper UX** — “Confirmed” only after finalized status.

**Not bugs (by design / needs on-chain action):**

- Empty yield history until reward events are indexed.
- Failed txs 31003 / 20003 — contract permissions and MCP issue_token template.

---

_Generated for MERIDIAN deployment session, July 2026._
