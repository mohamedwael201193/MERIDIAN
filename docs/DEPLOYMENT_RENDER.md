# Render Deployment — MERIDIAN Production Stack

**Updated:** 2026-07-02  
**Topology:** 3 active web services (optimized from 5)

---

## Active services

| Service     | Render name           | Type | URL                                            | What it does                                                                                                     |
| ----------- | --------------------- | ---- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **Backend** | `meridian-backend`    | Web  | https://meridian-backend-cu88.onrender.com     | Fastify REST API, Supabase indexer, embedded AI agents (`AGENTS_ENABLED=true`), OpenAPI `/docs`                  |
| **x402**    | `meridian-x402`       | Web  | https://meridian-x402-facilitator.onrender.com | Combined facilitator + resource (`X402_MODE=combined`): `/verify`, `/settle`, `/supported`, paid `/api/*` routes |
| **MCP**     | `meridian-mcp-server` | Web  | https://meridian-mcp-server-94q4.onrender.com  | 12 MCP tools over Streamable HTTP (`POST /mcp`)                                                                  |

### Suspended (redundant)

| Service                  | Reason                                 |
| ------------------------ | -------------------------------------- |
| `meridian-agents`        | Agents embedded in backend worker loop |
| `meridian-x402-resource` | Merged into combined x402 service      |

---

## Service IDs (Render API)

| Service             | ID                         |
| ------------------- | -------------------------- |
| meridian-backend    | `srv-d90sq0bsq97s739mnin0` |
| meridian-x402       | `srv-d90sq66q1p3s738jap8g` |
| meridian-mcp-server | `srv-d90sq73sq97s739mnm10` |

---

## Build & start commands

See `render.yaml` for blueprint. Key commands:

**Backend**

```bash
pnpm install --frozen-lockfile
pnpm --filter @meridian/env run build
pnpm --filter @meridian/agents-shared run build
pnpm --filter @meridian/yield-agent run build
pnpm --filter @meridian/compliance-agent run build
pnpm --filter @meridian/audit-agent run build
pnpm --filter @meridian/backend run build
node backend/dist/main.js
```

**x402 (combined)**

```bash
pnpm install --frozen-lockfile
pnpm --filter @meridian/casper-sdk run build
pnpm --filter @meridian/x402-facilitator run build
X402_MODE=combined node x402-facilitator/dist/index.js
```

**MCP**

```bash
pnpm install --frozen-lockfile
pnpm --filter @meridian/env run build
pnpm --filter @meridian/casper-sdk run build
pnpm --filter @meridian/mcp-server run build
MERIDIAN_MCP_TRANSPORT=http node mcp-server/dist/index.js
```

---

## Environment variables by service

### meridian-backend

| Variable                      | Purpose                                             |
| ----------------------------- | --------------------------------------------------- |
| `DATABASE_URL`, Supabase keys | Postgres indexer + agent decisions                  |
| `UPSTASH_*`                   | Agent coordination, rate limits                     |
| `CASPER_*`, `CSPR_*`          | RPC, sidecar, event streaming                       |
| `MERIDIAN_API_KEY`            | REST auth                                           |
| `MERIDIAN_CONTRACTS_PATH`     | `deployed/addresses.json`                           |
| `AGENTS_ENABLED=true`         | Spawns `agents/run-all.mjs`                         |
| `AGENT_INTERVAL_MS`           | Agent tick interval (default 300000)                |
| `MERIDIAN_YIELD_AGENT_*`      | Yield agent identity (pubkey, hash, **inline PEM**) |
| `MERIDIAN_COMPLIANCE_AGENT_*` | Compliance agent identity                           |
| `MERIDIAN_AUDIT_AGENT_*`      | Audit agent identity                                |
| AI provider keys              | OpenAI, Groq, Gemini, etc.                          |
| `X402_FACILITATOR_URL`        | Cross-service URL                                   |
| `BACKEND_URL`                 | Self URL for agent callbacks                        |

**Does NOT receive:** `MERIDIAN_DEPLOYER_PRIVATE_KEY_PEM`

### meridian-x402

| Variable                            | Purpose                                  |
| ----------------------------------- | ---------------------------------------- |
| `MERIDIAN_DEPLOYER_PRIVATE_KEY_PEM` | **Inline PEM** — settlement signing only |
| `X402_PAY_TO_ACCOUNT_HASH`          | Payment recipient                        |
| `X402_PAYMENT_AMOUNT_MOTES`         | Minimum payment                          |
| `CASPER_*`, `UPSTASH_*`             | RPC + replay guard                       |
| Agent **public** keys + hashes      | Identity reference (no agent PEMs)       |

### meridian-mcp-server

| Variable                          | Purpose                    |
| --------------------------------- | -------------------------- |
| Phase-1 cloud env                 | `@meridian/env` validation |
| `BACKEND_URL`, `MERIDIAN_API_KEY` | Backend proxy reads        |
| `X402_FACILITATOR_URL`            | x402 tool references       |
| `MERIDIAN_CONTRACTS_PATH`         | Contract hashes            |

**Does NOT receive:** Any private keys (non-custodial unsigned txs only)

---

## Sync & deploy scripts

```bash
# Upload env from local .env (MERIDIAN services only)
node scripts/render-optimize.mjs

# Verify health after deploy
node scripts/render-verify.mjs
```

Requires `RENDER_API_KEY` or `rebder_api_key` in local `.env` (never commit).

---

## Health endpoints

| Service | Path                            | Expected |
| ------- | ------------------------------- | -------- |
| Backend | `/health`, `/ready`, `/metrics` | 200      |
| x402    | `/health`, `/supported`         | 200      |
| MCP     | `/health`, `/metrics`           | 200      |

---

## Live contracts (testnet)

Source of truth: `deployed/addresses.json`

| Contract           | Package hash                                                                        |
| ------------------ | ----------------------------------------------------------------------------------- |
| ComplianceRegistry | `contract-package-e6ed2d2eb8a1ffc7aa55a4158643a3682493d6f15f1e7123113a9c8534ee84f8` |
| MeridianToken      | `contract-package-9bcac97d0e6723049fc130daa22f69e88a5d077a1df6b4e38536f0703bcaa2ca` |
| StakingVault       | `contract-package-3062ba32a4ef4d3fd0fc5c9d0895980b7bbbcc5f407590d1b14c60ca631300c7` |
| YieldDistributor   | `contract-package-378bf2fddb1e574f39014bff6280f101c264da6fc4c629ad4e8c0d8ce55a6c34` |
| MeridianAudit      | `contract-package-1d8bc0bbbb6dda232afcff2afa257e7572d1ac33c518b1852b9a34c707493d84` |

Network: `casper-test` | Explorer: https://testnet.cspr.live/

---

## Rollback

Render dashboard → previous deploy. Database migrations are forward-only.

See also: `docs/AGENT_IDENTITY.md`, `docs/reports/DEPLOYMENT_REPORT.md`
