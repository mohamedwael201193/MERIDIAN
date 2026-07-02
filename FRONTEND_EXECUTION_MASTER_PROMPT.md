# FRONTEND EXECUTION MASTER PROMPT — MERIDIAN Phase 9

> **YOU ARE:** The Frontend Implementation Agent for MERIDIAN.
> **YOUR MISSION:** Transform the existing MERIDIAN frontend from mock/demo state into a **fully production-ready dApp** connected to the live backend, Casper testnet, smart contracts, MCP server, x402 infrastructure, AI agents, Supabase-indexed data, and Upstash-backed coordination.
> **YOU DO NOT:** Modify smart contracts, backend, MCP server, x402 services, AI agents, database schema, deployment, Render, Supabase schema, or Upstash configuration.
> **THIS FILE IS:** An execution prompt. Follow it literally. Do not treat it as passive documentation.

---

## 0. EXECUTION CONTRACT

Before writing a single line of frontend code, you MUST complete Sections 1–4 in order. Skipping research, env inspection, or mock audit is a **hard failure**.

At the end of execution you MUST produce exactly one report:

```
docs/reports/FRONTEND_INTEGRATION_REPORT.md
```

You MUST NOT produce any other report files unless explicitly instructed.

If any required backend endpoint, MCP tool, contract entrypoint, or env variable is missing — **STOP immediately**, document the gap in the integration report, and do not invent a workaround that modifies forbidden systems.

---

## 1. MANDATORY READING — READ EVERY FILE BEFORE TOUCHING CODE

You MUST read **every file listed below in full** before modifying any frontend code. Treat these as authoritative context. Cross-reference conflicts using `docs/DOCUMENTATION_RESOLUTIONS.md`.

### 1.1 Core docs (`docs/`)

Read each file completely:

| File                                    | Why                                                                |
| --------------------------------------- | ------------------------------------------------------------------ |
| `docs/ARCHITECTURE.md`                  | Cloud-first topology, data flow, trust boundaries                  |
| `docs/BENCHMARKS.md`                    | Performance thresholds the UI must not violate                     |
| `docs/CASPER_DEVELOPER_BIBLE.md`        | Frontend patterns, CSPR.click, SDK pins, anti-patterns             |
| `docs/CASPER_EXECUTION_MASTER_GUIDE.md` | Phase 9 frontend checklist, page inventory, verification           |
| `docs/CASPER_PROTOCOL_BIBLE.md`         | TransactionV1, CEP-88, accounts, auction, finality                 |
| `docs/AGENT_IDENTITY.md`                | Agent wallets, inline PEM, attestations, Render key placement      |
| `docs/DEPLOYMENT_RENDER.md`             | Live Render topology (3 services), env-by-service, contract hashes |
| `docs/DOCUMENTATION_RESOLUTIONS.md`     | Conflict resolution when docs disagree                             |
| `docs/ENVIRONMENT_REQUIREMENTS.md`      | Every env var, including `NEXT_PUBLIC_*`                           |
| `docs/FINAL_PROMPT.md`                  | Absolute execution rules (no mocks, no placeholders)               |
| `docs/GAS_ANALYSIS.md`                  | Gas expectations for user-facing tx flows                          |
| `docs/LESSONS_LEARNED.md`               | Known pitfalls (wallet, RPC, frontend env drift)                   |
| `docs/MERIDIAN_ENGINEERING_BIBLE.md`    | Monorepo layout, tx lifecycle, deployment pipeline                 |
| `docs/OFFICIAL_REFERENCE_INDEX.md`      | Canonical official URLs and version pins                           |
| `docs/PROJECT_EXECUTION_PLAN.md`        | Phase boundaries; frontend is Phase 9                              |
| `docs/SECURITY_FINDINGS.md`             | Security constraints for browser-exposed code                      |
| `docs/USER_ACTIONS.md`                  | Human prerequisites already completed                              |

### 1.2 Phase reports (`docs/reports/`)

Read **every** report file:

| File                                            | Why                                               |
| ----------------------------------------------- | ------------------------------------------------- |
| `docs/reports/README.md`                        | Phase status index                                |
| `docs/reports/PHASE_1_REPORT.md`                | Environment baseline                              |
| `docs/reports/PHASE_2_REPORT.md`                | Contract architecture                             |
| `docs/reports/PHASE_3_REPORT.md`                | Contract test results                             |
| `docs/reports/PHASE_4_REPORT.md`                | Live testnet deployment                           |
| `docs/reports/PHASE_4_5_REPORT.md`              | Production hardening                              |
| `docs/reports/PHASE_5_REPORT.md`                | Backend API + indexer                             |
| `docs/reports/PHASE_6_REPORT.md`                | AI agents behavior                                |
| `docs/reports/PHASE_7_REPORT.md`                | MCP + x402                                        |
| `docs/reports/PHASE_8_REPORT.md`                | E2E integration                                   |
| `docs/reports/PHASE_8_5_REPORT.md`              | Post-funding validation (100 x402 settlements)    |
| `docs/reports/DEPLOYMENT_REPORT.md`             | Live Render URLs and verification                 |
| `docs/reports/AGENT_IDENTITY_REPORT.md`         | Agent wallet separation verification (2026-07-02) |
| `docs/reports/x402_100_settlement_results.json` | Evidence of live x402 settlements                 |

Also read service READMEs:

- `mcp-server/README.md`
- `x402-facilitator/README.md`

### 1.3 Live codebase references (read-only)

Inspect without modifying:

| Path                                      | Why                                                 |
| ----------------------------------------- | --------------------------------------------------- |
| `deployed/addresses.json`                 | **Single source of truth** for live contract hashes |
| `backend/src/api/routes/index.ts`         | Exact REST API surface                              |
| `backend/src/api/plugins/auth.ts`         | Auth rules (`X-API-Key`)                            |
| `backend/src/app.ts`                      | Health, ready, metrics, OpenAPI                     |
| `mcp-server/src/tools/read-tools.ts`      | MCP read tool schemas                               |
| `mcp-server/src/tools/write-tools.ts`     | MCP write tool schemas (unsigned TransactionV1)     |
| `x402-facilitator/src/facilitator-app.ts` | `/verify`, `/settle`, `/supported`                  |
| `x402-facilitator/src/resource-app.ts`    | Paid resource routes + 402 flow                     |
| `render.yaml`                             | Current production service topology                 |
| `packages/meridian-ts-types/`             | Generated contract types (if present)               |
| `frontend/`                               | Existing frontend to audit and migrate              |

**Exit criteria for Section 1:** You can articulate MERIDIAN's data flow from chain → CSPR.cloud → indexer → Supabase → backend → frontend without guessing.

---

## 2. MANDATORY OFFICIAL RESEARCH — VERIFY BEFORE IMPLEMENTING

You MUST verify the **latest official versions** of every resource below at execution time. Documentation older than 6 months is not authoritative. Never use unofficial blogs, Medium posts, or outdated tutorials.

### 2.1 Verification protocol

For each resource:

1. Fetch the official URL.
2. Record the version/tag/commit you verified.
3. Compare against pins in `docs/OFFICIAL_REFERENCE_INDEX.md` and `docs/CASPER_DEVELOPER_BIBLE.md`.
4. If a pin differs from latest stable official release, **STOP** and note the discrepancy in your integration report — do not silently upgrade dependencies that affect other monorepo packages.

### 2.2 Required official sources

| Domain                 | Official URL                                                                            | What to verify                                                                 |
| ---------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Casper docs            | https://docs.casper.network                                                             | TransactionV1, accounts, global state, JSON-RPC                                |
| Casper 2.0 Condor      | https://docs.casper.network/condor/index                                                | Protocol features used by MERIDIAN                                             |
| CEP-88 events          | https://docs.casper.network/next/developers/writing-onchain-code/events                 | Event indexing assumptions                                                     |
| Native access controls | https://docs.casper.network/next/developers/writing-onchain-code/native-access-controls | Contract permissions                                                           |
| Casper JS SDK          | https://github.com/casper-ecosystem/casper-js-sdk                                       | **Pin: 5.0.12** — TransactionV1Builder, RPC client                             |
| casper-js-sdk docs     | https://casper-ecosystem.github.io/casper-js-sdk/                                       | Builder APIs, signing patterns                                                 |
| casper-eip-712         | https://github.com/casper-ecosystem/casper-eip-712                                      | x402 payment signing (`casper-native`)                                         |
| Odra                   | https://odra.dev/docs                                                                   | Contract entrypoints the frontend indirectly invokes                           |
| Odra llms.txt          | https://odra.dev/llms.txt                                                               | Machine-readable Odra index                                                    |
| CEP-18                 | https://github.com/casper-ecosystem/cep18                                               | Token standard v1.2.0                                                          |
| CSPR.cloud testnet RPC | https://node.testnet.cspr.cloud/rpc                                                     | RPC endpoint shape                                                             |
| CSPR.cloud REST/SSE    | https://api.testnet.cspr.cloud                                                          | Sidecar REST (backend uses this; frontend must NOT call directly with API key) |
| CSPR.click SDK         | https://github.com/make-software/csprclick-sdk                                          | Wallet integration (**never** direct Casper Wallet)                            |
| CSPR.click React       | https://github.com/make-software/csprclick-react                                        | ClickProvider, useClickRef                                                     |
| Casper Wallet docs     | https://docs.casper.network/users/setup-a-wallet                                        | Reference only — MERIDIAN uses CSPR.click                                      |
| MCP Specification      | https://modelcontextprotocol.io/specification/2025-11-25                                | Streamable HTTP transport                                                      |
| MCP SDK                | https://github.com/modelcontextprotocol/typescript-sdk                                  | `@modelcontextprotocol/sdk` patterns                                           |
| MCP Inspector          | https://github.com/modelcontextprotocol/inspector                                       | Local MCP debugging                                                            |
| x402                   | https://github.com/odradev/casper-x402-poc                                              | Verify/settle API shape                                                        |
| Casper MCP examples    | https://github.com/make-software/cspr-trade-mcp                                         | MCP tool patterns (reference)                                                  |
| Casper AI Toolkit      | https://docs.casper.network/developers/ai-toolkit (if available)                        | AI-assisted flows                                                              |
| donation-demo dApp     | https://github.com/casper-ecosystem/donation-demo                                       | Official full dApp frontend reference                                          |
| casper-node releases   | https://github.com/casper-network/casper-node/releases                                  | Node version compatibility                                                     |
| CEP index              | https://github.com/casper-network/ceps                                                  | Standard references                                                            |

### 2.3 Forbidden sources

- Unofficial Medium/Dev.to tutorials
- `@toruslabs/casper-js-sdk` (abandoned)
- Direct `@casper-network/casper-js-sdk` imports bypassing monorepo wrapper (use `casper-js-sdk@5.0.12` or `@meridian/casper-sdk` pattern if needed server-side)
- Mock blockchain libraries
- Hardcoded testnet responses copied from blog posts

**Exit criteria for Section 2:** You have a written list of verified versions and official URLs used for frontend dependency pins.

---

## 3. ENVIRONMENT — USE REAL `.env` VALUES ONLY

### 3.1 Inspection protocol

1. Read the repository root `.env` file (never commit it).
2. Read `.env.example` for documented variable names only (never copy placeholder secrets from example).
3. Map each variable to frontend usage (client-safe vs server-only).
4. Never create fake API keys, wallet keys, or placeholder URLs.
5. Never overwrite valid production values.
6. Never expose server secrets in `NEXT_PUBLIC_*` variables.

### 3.2 Server-only variables (Next.js API routes / Route Handlers ONLY)

These MUST NEVER appear in client bundles:

```
MERIDIAN_API_KEY
DATABASE_URL
SUPABASE_SERVICE_ROLE_KEY
CASPER_API_KEY
CSPR_CLOUD_AUTH_TOKEN
UPSTASH_REDIS_REST_TOKEN
OPENAI_API_KEY
(all other AI provider keys)
MERIDIAN_DEPLOYER_PRIVATE_KEY_PEM
MERIDIAN_YIELD_AGENT_PRIVATE_KEY_PEM
MERIDIAN_COMPLIANCE_AGENT_PRIVATE_KEY_PEM
MERIDIAN_AUDIT_AGENT_PRIVATE_KEY_PEM
(any inline PEM material — server-only, never in browser)
RENDER_API_KEY / rebder_api_key
github_token
```

### 3.3 Client-safe variables (`NEXT_PUBLIC_*`)

Populate from real `.env` values and `deployed/addresses.json`:

| Variable                                     | Source                                                   | Purpose                                    |
| -------------------------------------------- | -------------------------------------------------------- | ------------------------------------------ |
| `NEXT_PUBLIC_CASPER_NETWORK`                 | `.env` `CASPER_NETWORK`                                  | CSPR.click network (`casper-test`)         |
| `NEXT_PUBLIC_MERIDIAN_CONTRACT_PACKAGE_HASH` | `deployed/addresses.json` → `MeridianToken.package_hash` | Contract calls in browser                  |
| `NEXT_PUBLIC_MCP_SERVER_URL`                 | Live MCP Render URL or local                             | MCP client endpoint                        |
| `NEXT_PUBLIC_BACKEND_URL`                    | Optional — prefer server proxy                           | Only if unavoidable; prefer `/api/*` proxy |

**Live MeridianToken package hash (testnet):**

```
contract-package-9bcac97d0e6723049fc130daa22f69e88a5d077a1df6b4e38536f0703bcaa2ca
```

### 3.4 Server-side frontend variables (not exposed to browser)

| Variable               | Purpose                                                                |
| ---------------------- | ---------------------------------------------------------------------- |
| `BACKEND_URL`          | Proxy target for all REST calls                                        |
| `MERIDIAN_API_KEY`     | Sent as `X-API-Key` header to backend                                  |
| `X402_FACILITATOR_URL` | x402 verify/settle (combined service URL)                              |
| `CASPER_RPC_URL`       | Optional server-side RPC for tx status polling (no API key in browser) |

### 3.5 Production service URLs (Render — verify live before use)

These are the current deployed endpoints. **Re-verify with `GET /health` before integration testing.** Free-tier services cold-start in 30–60s.

| Service                                | URL                                              |
| -------------------------------------- | ------------------------------------------------ |
| Backend (+ embedded AI agents)         | `https://meridian-backend-cu88.onrender.com`     |
| x402 combined (facilitator + resource) | `https://meridian-x402-facilitator.onrender.com` |
| MCP Server (HTTP)                      | `https://meridian-mcp-server-94q4.onrender.com`  |

Local development ports (from phase reports):

| Service | Port |
| ------- | ---- |
| Backend | 3000 |
| x402    | 3001 |
| MCP     | 3002 |

**Exit criteria for Section 3:** All frontend env vars mapped; zero secrets in client bundle; grep confirms no `CASPER_API_KEY` or `MERIDIAN_API_KEY` in `frontend/` client code.

### 3.6 Agent identity (read-only for frontend)

AI agents run **embedded in the backend** on Render. Each agent has its own Casper wallet (public key + account hash). Private keys are **server-only** on `meridian-backend`.

| Agent      | Public env vars (safe to display in UI)                                          | Used for                             |
| ---------- | -------------------------------------------------------------------------------- | ------------------------------------ |
| Yield      | `MERIDIAN_YIELD_AGENT_PUBLIC_KEY`, `MERIDIAN_YIELD_AGENT_ACCOUNT_HASH`           | Decision feed labels, explorer links |
| Compliance | `MERIDIAN_COMPLIANCE_AGENT_PUBLIC_KEY`, `MERIDIAN_COMPLIANCE_AGENT_ACCOUNT_HASH` | Screening attribution                |
| Audit      | `MERIDIAN_AUDIT_AGENT_PUBLIC_KEY`, `MERIDIAN_AUDIT_AGENT_ACCOUNT_HASH`           | Review attribution                   |

Decisions from `GET /api/v1/decisions` may include an `attestation` object:

```json
{
  "attestation": {
    "agent": "yield",
    "publicKey": "0202...",
    "accountHash": "account-hash-...",
    "digest": "<sha256>",
    "signature": "<hex>"
  }
}
```

Frontend MAY display attestation metadata and link account hashes to `https://testnet.cspr.live/account/...`. Frontend MUST NOT verify signatures unless implementing explicit crypto UI — optional Phase 12 enhancement.

**Deployer wallet** (`MERIDIAN_DEPLOYER_*`) is used only by x402 settlement — never label agent actions as deployer-signed.

Reference: `docs/AGENT_IDENTITY.md`

### 3.7 Complete environment catalog (by subsystem)

Read root `.env` at execution time. Map each variable:

#### Casper / CSPR.cloud

| Variable                | Used by            | Frontend exposure                |
| ----------------------- | ------------------ | -------------------------------- |
| `CASPER_NETWORK`        | All services       | `NEXT_PUBLIC_CASPER_NETWORK`     |
| `CASPER_RPC_URL`        | Backend, x402, MCP | Server proxy only                |
| `CASPER_CHAIN_NAME`     | All on-chain ops   | Via `NEXT_PUBLIC_CASPER_NETWORK` |
| `CASPER_API_KEY`        | Backend, x402, MCP | **Never client**                 |
| `CASPER_SIDE_CAR_URL`   | Backend indexer    | **Never client**                 |
| `CSPR_STREAMING_URL`    | Backend indexer    | **Never client**                 |
| `CSPR_CLOUD_AUTH_TOKEN` | Backend streaming  | **Never client**                 |

#### Database / cache

| Variable                            | Used by               | Frontend                                           |
| ----------------------------------- | --------------------- | -------------------------------------------------- |
| `DATABASE_URL`                      | Backend, MCP          | Server proxy                                       |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY` | Optional direct reads | Anon key only if using Supabase client server-side |
| `SUPABASE_SERVICE_ROLE_KEY`         | Backend               | **Never client**                                   |
| `UPSTASH_REDIS_REST_URL/TOKEN`      | Backend, agents, x402 | **Never client**                                   |

#### MERIDIAN API

| Variable                 | Used by                          | Frontend                   |
| ------------------------ | -------------------------------- | -------------------------- |
| `MERIDIAN_API_KEY`       | All REST/MCP proxy routes        | Server route handlers only |
| `BACKEND_URL`            | Agents, MCP, x402, Next.js proxy | Server only                |
| `BACKEND_URL_PRODUCTION` | Local scripts pointing at Render | Server only                |

#### Wallets (inline PEM — see `docs/AGENT_IDENTITY.md`)

| Variable                      | Service          | Frontend                   |
| ----------------------------- | ---------------- | -------------------------- |
| `MERIDIAN_DEPLOYER_*`         | x402 facilitator | Never                      |
| `MERIDIAN_YIELD_AGENT_*`      | Backend agents   | Public key/hash only in UI |
| `MERIDIAN_COMPLIANCE_AGENT_*` | Backend agents   | Public key/hash only       |
| `MERIDIAN_AUDIT_AGENT_*`      | Backend agents   | Public key/hash only       |

#### x402

| Variable                    | Purpose                              |
| --------------------------- | ------------------------------------ |
| `X402_FACILITATOR_URL`      | Combined service base URL            |
| `X402_PAY_TO_ACCOUNT_HASH`  | Payment recipient (deployer account) |
| `X402_PAYMENT_AMOUNT_MOTES` | Minimum payment (default 2500000000) |
| `MERIDIAN_TOKEN_PACKAGE`    | Token package for resource routes    |

#### AI providers (backend/agents only)

`OPENAI_API_KEY`, `OPENAI_BASE_URL`, `OPENAI_MODEL`, `GROQ_API_KEY`, `GEMINI_API_KEY`, `CEREBRAS_API_KEY`, `SAMBANOVA_API_KEY`, `TOGETHER_API_KEY`, `OPENROUTER_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`

#### Frontend-specific (`NEXT_PUBLIC_*`)

| Variable                                     | Source                                    | Purpose                          |
| -------------------------------------------- | ----------------------------------------- | -------------------------------- |
| `NEXT_PUBLIC_CASPER_NETWORK`                 | `CASPER_NETWORK`                          | CSPR.click network id            |
| `NEXT_PUBLIC_MERIDIAN_CONTRACT_PACKAGE_HASH` | `deployed/addresses.json` → MeridianToken | Primary token contract           |
| `NEXT_PUBLIC_MCP_SERVER_URL`                 | Render MCP URL                            | MCP client (prefer server proxy) |
| `NEXT_PUBLIC_BACKEND_URL`                    | Optional                                  | Prefer `/api/*` proxy instead    |

#### Ops / deployment (never client)

`RENDER_API_KEY`, `rebder_api_key`, `github_token`, `INDEXER_*`, `AGENTS_ENABLED`, `AGENT_INTERVAL_MS`

### 3.8 Live contracts & deployment artifacts

**Single source of truth:** `deployed/addresses.json`

| Contract           | Package hash                                                                        | Deploy tx (in addresses.json) |
| ------------------ | ----------------------------------------------------------------------------------- | ----------------------------- |
| ComplianceRegistry | `contract-package-e6ed2d2eb8a1ffc7aa55a4158643a3682493d6f15f1e7123113a9c8534ee84f8` | `930efed7...`                 |
| MeridianToken      | `contract-package-9bcac97d0e6723049fc130daa22f69e88a5d077a1df6b4e38536f0703bcaa2ca` | `ca4c4b96...`                 |
| StakingVault       | `contract-package-3062ba32a4ef4d3fd0fc5c9d0895980b7bbbcc5f407590d1b14c60ca631300c7` | `e69eb51c...`                 |
| YieldDistributor   | `contract-package-378bf2fddb1e574f39014bff6280f101c264da6fc4c629ad4e8c0d8ce55a6c34` | `2c3ca30d...`                 |
| MeridianAudit      | `contract-package-1d8bc0bbbb6dda232afcff2afa257e7572d1ac33c518b1852b9a34c707493d84` | `1611925b...`                 |

Network: `casper-test` | Deployed: `2026-06-28` | Explorer: `https://testnet.cspr.live/`

Wiring txs (also in `addresses.json`): `wire_set_token_address`, `wire_set_yield_distributor`, `wire_set_staking_vault`, `wire_register_holder`

Backend reads contracts from `MERIDIAN_CONTRACTS_PATH=deployed/addresses.json` (committed to git).

### 3.9 Render production services (3 active)

Re-verify with health checks before integration testing.

| Service                 | URL                                            | Role                                        | Key endpoints                                               |
| ----------------------- | ---------------------------------------------- | ------------------------------------------- | ----------------------------------------------------------- |
| **meridian-backend**    | https://meridian-backend-cu88.onrender.com     | REST API + indexer + **embedded AI agents** | `/health`, `/ready`, `/api/v1/*`, `/docs`                   |
| **meridian-x402**       | https://meridian-x402-facilitator.onrender.com | Combined x402 facilitator + paid resources  | `/verify`, `/settle`, `/supported`, `/api/yield-rate` (402) |
| **meridian-mcp-server** | https://meridian-mcp-server-94q4.onrender.com  | MCP Streamable HTTP (12 tools)              | `/health`, `POST /mcp`                                      |

**Suspended:** `meridian-agents` (worker), `meridian-x402-resource` (merged into x402).

Service IDs and env-by-service detail: `docs/DEPLOYMENT_RENDER.md`

Local development ports:

| Service | Port |
| ------- | ---- |
| Backend | 3000 |
| x402    | 3001 |
| MCP     | 3002 |

---

## 4. STRICT LIMITS — DO NOT MODIFY THESE SYSTEMS

The following are **production-ready** and the **Single Source of Truth**. The frontend MUST adapt to them.

```
FORBIDDEN TO MODIFY:
├── contracts/                    # Odra smart contracts
├── backend/                      # Fastify API + indexer
├── agents/                       # AI agents
├── mcp-server/                   # MCP server (12 tools)
├── x402-facilitator/             # x402 facilitator + resource
├── packages/meridian-env/        # Env validation (except adding frontend-only package if needed)
├── deployed/addresses.json       # Live contract addresses
├── backend/src/db/migrations/    # Database schema
├── render.yaml                   # Deployment topology
├── Supabase schema               # Managed via existing migrations
└── Upstash configuration         # Managed via existing env
```

Allowed frontend scope:

```
frontend/                         # Next.js dApp (primary)
tests/e2e/frontend/               # Playwright tests (create if missing)
docs/reports/FRONTEND_INTEGRATION_REPORT.md  # Final deliverable only
```

If the frontend requires a new backend endpoint — **STOP and report**. Do not add backend routes.

---

## 5. REMOVE ALL MOCKS — ZERO TOLERANCE

### 5.1 Mandatory deletion targets

Search the entire `frontend/` tree and **delete or replace** every instance of:

- Mock data files (`mock*.ts`, `fixtures/*.json`, `__mocks__/`)
- Fake API handlers that return static JSON
- Fake wallet implementations
- Demo/simulation logic (`simulateTransaction`, `fakeSign`, etc.)
- Hardcoded dashboard statistics
- Placeholder charts with static arrays
- Temporary hooks (`useMock*`, `useDemo*`, `useFake*`)
- Static `const STATS = { tvl: 1234567 }` patterns
- MSW handlers returning fabricated chain data (unless used exclusively in unit tests with real shape validation — prefer deletion)
- Comments containing `TODO`, `FIXME`, `placeholder`, `mock`, `fake`, `demo`, `hardcoded`

### 5.2 Verification grep (must return zero hits in production code)

Run after mock removal:

```bash
rg -i "mock|fake|placeholder|demo|hardcoded|lorem|sample data|dummy" frontend/ \
  --glob '!**/*.test.*' --glob '!**/*.spec.*' --glob '!**/e2e/**'
rg "setInterval.*Math\.random|fakeBalance|mockRpc" frontend/
rg "@make-software/casper-wallet|casper-wallet$" frontend/   # must be 0 — use CSPR.click only
rg "node\.cspr\.cloud|api\.cspr\.cloud" frontend/          # must be 0 — no direct CSPR.cloud from browser
```

### 5.3 Real data sources only

| UI data                     | Source                                                                         |
| --------------------------- | ------------------------------------------------------------------------------ |
| Token list, supply, staking | `GET /api/v1/tokens` via Next.js proxy                                         |
| Yield/APY                   | `GET /api/v1/tokens/:packageHash/yield`                                        |
| Yield history charts        | `GET /api/v1/yields/history`                                                   |
| Holder compliance           | `GET /api/v1/holders/:accountHash/compliance`                                  |
| Holders list                | `GET /api/v1/holders`                                                          |
| On-chain events             | `GET /api/v1/events`                                                           |
| Audit summaries             | `GET /api/v1/audit/summaries`                                                  |
| AI agent decisions          | `GET /api/v1/decisions`                                                        |
| Wallet balance              | CSPR.click + Casper RPC (server-proxied or public testnet RPC without API key) |
| Unsigned transactions       | MCP write tools via Streamable HTTP                                            |
| Signed transaction submit   | CSPR.click sign → `casper-js-sdk` RPC submit from browser OR server route      |
| x402 paid data              | Combined x402 service resource routes                                          |
| Protocol stats (landing)    | Aggregated from live backend endpoints                                         |

**Exit criteria for Section 5:** Mock grep returns zero; every dashboard number traceable to a live API response.

---

## 6. PRODUCTION API CONTRACT — DO NOT INVENT ENDPOINTS

All backend routes require header `X-API-Key: <MERIDIAN_API_KEY>` except public paths.

### 6.1 Public backend paths (no API key)

```
GET /health
GET /ready
GET /metrics
GET /docs
GET /docs/json
GET /docs/yaml
```

### 6.2 Protected REST API (exact paths — do not rename)

```
GET  /api/v1/tokens
GET  /api/v1/tokens/:packageHash
GET  /api/v1/tokens/:packageHash/yield
GET  /api/v1/yields/history?limit=N          # max 200
GET  /api/v1/holders/:accountHash/compliance
GET  /api/v1/holders?limit=N                  # max 500
GET  /api/v1/events?limit=N                   # max 200
GET  /api/v1/audit/summaries?limit=N        # max 100
GET  /api/v1/decisions?limit=N              # max 200
POST /api/v1/decisions                        # agent-only; frontend READ only
```

Response envelope: `{ data: ... }` for successful GETs.

Errors: `{ error: { code: string, message: string } }`

### 6.3 Next.js proxy pattern (mandatory)

Frontend browser code MUST call `/api/...` Next.js routes. Route handlers attach `X-API-Key` server-side:

```typescript
// frontend/app/api/tokens/route.ts — pattern only; adapt to project structure
const res = await fetch(`${process.env.BACKEND_URL}/api/v1/tokens`, {
  headers: { 'X-API-Key': process.env.MERIDIAN_API_KEY! },
  next: { revalidate: 30 },
})
```

Never call Render backend URL directly from browser (exposes no key but bypasses proxy discipline and CORS control).

### 6.4 Live contract addresses (`deployed/addresses.json`)

| Contract           | Package hash                                                                        |
| ------------------ | ----------------------------------------------------------------------------------- |
| ComplianceRegistry | `contract-package-e6ed2d2eb8a1ffc7aa55a4158643a3682493d6f15f1e7123113a9c8534ee84f8` |
| MeridianToken      | `contract-package-9bcac97d0e6723049fc130daa22f69e88a5d077a1df6b4e38536f0703bcaa2ca` |
| StakingVault       | `contract-package-3062ba32a4ef4d3fd0fc5c9d0895980b7bbbcc5f407590d1b14c60ca631300c7` |
| YieldDistributor   | `contract-package-378bf2fddb1e574f39014bff6280f101c264da6fc4c629ad4e8c0d8ce55a6c34` |
| MeridianAudit      | `contract-package-1d8bc0bbbb6dda232afcff2afa257e7572d1ac33c518b1852b9a34c707493d84` |

Network: `casper-test` | Chain name: `casper-test`

Explorer base: `https://testnet.cspr.live/`

---

## 7. MCP INTEGRATION CONTRACT

### 7.1 Server endpoint

```
GET  /health
GET  /metrics
POST /mcp          # Streamable HTTP — session via mcp-session-id header
GET  /mcp
DELETE /mcp
```

Production URL: `https://meridian-mcp-server-94q4.onrender.com`

Use `@modelcontextprotocol/sdk` client or MCP Inspector patterns. Frontend MCP calls SHOULD run server-side (Next.js route) to avoid CORS/session complexity unless Streamable HTTP CORS is confirmed.

### 7.2 Read tools (6)

| Tool                    | Purpose                                        |
| ----------------------- | ---------------------------------------------- |
| `get_token_info`        | Token metadata from index + deployed addresses |
| `get_yield_rate`        | Current yield/APY                              |
| `get_holder_yield`      | Yield history                                  |
| `get_compliance_status` | Holder compliance by account hash              |
| `list_validators`       | Auction validators via RPC                     |
| `subscribe_audit`       | Audit feed (402 without payment)               |

### 7.3 Write tools (6) — non-custodial

Each returns **unsigned TransactionV1 JSON**. User MUST sign via CSPR.click. Frontend MUST NOT hold private keys.

| Tool                 | Purpose                          |
| -------------------- | -------------------------------- |
| `issue_token`        | Mint MRWA tokens                 |
| `transfer_token`     | MRWA transfer                    |
| `register_holder`    | Compliance registration          |
| `revoke_holder`      | Compliance revocation            |
| `restake`            | Vault restake between validators |
| `distribute_rewards` | Yield distribution               |

Public key schema: `/^0[23][0-9a-fA-F]{64,66}$/` (SECP256K1 68-char supported)

### 7.4 Transaction flow (mandatory)

```
1. User action in UI
2. Frontend calls MCP write tool (via server route) → unsigned TransactionV1
3. CSPR.click signs transaction in wallet
4. casper-js-sdk submits to Casper testnet RPC
5. Poll transaction status until finalized
6. SWR revalidates backend data
7. UI updates from indexed Supabase data (via backend API)
```

Never skip signing. Never submit unsigned transactions. Never fabricate transaction hashes.

---

## 8. x402 INTEGRATION CONTRACT

### 8.1 Combined service (production)

URL: `https://meridian-x402-facilitator.onrender.com`

Mode: `X402_MODE=combined` — facilitator + resource on one port.

### 8.2 Facilitator endpoints

```
GET  /health
GET  /metrics
GET  /supported
POST /verify
POST /settle
```

Supported payment: `{ scheme: "exact", network: "casper-test", asset: "CSPR" }`

### 8.3 Paid resource endpoints

```
GET /api/yield-rate              → 402 without X-Payment header
GET /api/validator-performance   → 402 without X-Payment header
GET /api/sanctions-merkle        → 402 without X-Payment header
```

### 8.4 Payment flow (mandatory — do not bypass)

```
1. Request resource → receive HTTP 402 + PaymentRequired JSON
2. Build signed payment payload (casper-eip-712 / x402 pattern)
3. POST /verify with { payment, network: "casper-test" }
4. POST /settle with same payment
5. Retry resource request with X-Payment header containing signed payment
6. Display settled data + link transaction hash to testnet explorer
```

Payment amount from env: `X402_PAYMENT_AMOUNT_MOTES` (default 2500000000 motes = 2.5 CSPR minimum on testnet).

Pay-to: `X402_PAY_TO_ACCOUNT_HASH` from `.env`.

Reference implementation: `x402-facilitator/scripts/smoke-settle.mjs`

Never mock 402 responses. Never skip settlement. Never display paid data without verified settlement.

---

## 9. FRONTEND TECHNOLOGY STACK (PIN EXACT VERSIONS)

Match `docs/CASPER_DEVELOPER_BIBLE.md` §12 and `docs/CASPER_EXECUTION_MASTER_GUIDE.md` §7.6:

```json
{
  "dependencies": {
    "next": "16.0.0",
    "react": "19.0.0",
    "react-dom": "19.0.0",
    "@make-software/csprclick-sdk": "1.13.0",
    "@make-software/csprclick-react": "1.13.0",
    "casper-js-sdk": "5.0.12",
    "tailwindcss": "4.0.0",
    "swr": "2.2.5",
    "zod": "3.25.76",
    "recharts": "2.12.7"
  },
  "devDependencies": {
    "typescript": "5.5.4",
    "vitest": "3.2.4",
    "@playwright/test": "1.46.0"
  }
}
```

Verify latest `@make-software/csprclick-*` against official GitHub releases before pinning. Never use direct Casper Wallet SDK.

Add `frontend/` to `pnpm-workspace.yaml` if not already present.

---

## 10. TARGET PAGE INVENTORY

Implement or migrate every page to real data:

| Route         | Purpose                                       | Data sources                                                     |
| ------------- | --------------------------------------------- | ---------------------------------------------------------------- |
| `/`           | Landing — live protocol stats                 | `/api/v1/tokens`, `/api/v1/events`, `/health`                    |
| `/dashboard`  | Holder dashboard — balance, yield, compliance | Backend + wallet + MCP read tools                                |
| `/issue`      | Token issuance flow                           | MCP `issue_token` → sign → submit                                |
| `/audit`      | Audit trail + agent decisions                 | `/api/v1/audit/summaries`, `/api/v1/decisions`, `/api/v1/events` |
| `/agents`     | AI agent activity feed                        | `/api/v1/decisions`                                              |
| `/mcp`        | MCP tool explorer (optional admin)            | MCP read/write tools                                             |
| `/x402`       | x402 paid resource demo                       | Combined x402 service                                            |
| `/compliance` | Holder compliance status                      | `/api/v1/holders/:hash/compliance`                               |
| `/staking`    | Staking/restake panel                         | MCP `restake`, vault data from backend                           |

Components (from engineering bible — implement with real data):

- `WalletConnect` — CSPR.click
- `TokenIssueForm` — MCP + sign + submit
- `StakingPanel` — live vault + validator data
- `YieldChart` — `/api/v1/yields/history`
- `ComplianceBadge` — compliance API
- `AuditTrail` — events + audit summaries
- `AgentDecisionFeed` — decisions API
- `X402PaymentFlow` — full 402 → verify → settle → access
- `TransactionStatus` — real tx hash polling

---

## 11. IMPLEMENTATION PHASES

Execute phases **sequentially**. Do not start Phase N+1 until Phase N exit criteria pass.

---

### PHASE 1 — Frontend Audit

**Objective:** Map every mock, every route, every broken integration.

**Tasks:**

1. Inventory all files under `frontend/`.
2. List every route, component, hook, API route, and env usage.
3. Tag each data source as `MOCK`, `PARTIAL`, or `LIVE`.
4. Record dependency versions in `frontend/package.json`.
5. Compare against Section 10 page inventory — note gaps.
6. Run mock grep commands from Section 5.2 — save baseline hit count.
7. Document current wallet integration approach (must be CSPR.click or missing).

**Acceptance criteria:**

- Written audit table: file → mock status → required real source.
- Baseline mock grep count recorded.

**Testing:**

- None (read-only audit).

**Exit criteria:**

- Audit complete; no code changes yet.
- User-visible mock surfaces identified.

---

### PHASE 2 — Delete Mock Layer

**Objective:** Remove all mock/demo/fake data paths.

**Tasks:**

1. Delete mock JSON, fixtures, fake handlers, demo hooks.
2. Remove hardcoded stats from all components.
3. Replace static chart data with empty loading states (not fake data).
4. Remove fake wallet providers.
5. Re-run Section 5.2 grep — must trend to zero.

**Acceptance criteria:**

- Zero mock grep hits in production frontend code.
- App builds but dashboards show loading/empty states (expected temporarily).

**Testing:**

- `pnpm --filter frontend run build` succeeds.
- `pnpm --filter frontend run lint` passes.

**Exit criteria:**

- No mock data remains.
- Build green.

---

### PHASE 3 — API Integration

**Objective:** Wire all read paths to live backend via Next.js proxy.

**Tasks:**

1. Create `frontend/lib/api.ts` — typed client for proxied routes.
2. Implement Next.js route handlers for every backend GET in Section 6.2.
3. Attach `X-API-Key` server-side only.
4. Use SWR for client caching with revalidation on focus.
5. Wire landing, dashboard, audit, agents pages to live endpoints.
6. Handle 401, 404, 503, empty arrays, and loading states.

**Acceptance criteria:**

- Every dashboard widget displays data from live backend responses.
- Network tab shows `/api/*` calls returning real indexed data.
- No direct browser calls to Render backend URL.

**Testing:**

- Manual: each page loads real data against live Render backend.
- Unit: API client parses `{ data }` envelope with Zod schemas.

**Exit criteria:**

- All read-only UI connected to backend.
- Cold-start tolerance: show loading UI for Render free-tier wake-up.

---

### PHASE 4 — Wallet Integration

**Objective:** Production CSPR.click wallet connect/disconnect/sign.

**Tasks:**

1. Implement `frontend/lib/csprclick.ts` with ClickProvider config.
2. Wrap app layout with `@make-software/csprclick-react` ClickProvider.
3. Network: `NEXT_PUBLIC_CASPER_NETWORK=casper-test`.
4. Implement connect/disconnect, account display, balance fetch.
5. Handle wallet rejection, timeout, wrong network.
6. Never import direct Casper Wallet SDK.

**Acceptance criteria:**

- Wallet connects on testnet.
- Account hash/public key displayed matches CSPR.click session.
- Disconnect clears session state.

**Testing:**

- Manual: connect → see account → disconnect.
- E2E (Playwright): wallet flow with CSPR.click test configuration.

**Exit criteria:**

- Wallet integration complete per official CSPR.click docs.

---

### PHASE 5 — Smart Contract Integration

**Objective:** All contract references use live `deployed/addresses.json` values.

**Tasks:**

1. Load contract package hashes from env + deployed addresses (no hardcoding in components).
2. Display explorer links using `explorer_url` pattern from addresses file.
3. Ensure TransactionV1 payloads reference correct package hashes.
4. Validate contract names match: MeridianToken, StakingVault, ComplianceRegistry, YieldDistributor, MeridianAudit.

**Acceptance criteria:**

- UI shows live testnet explorer links that resolve.
- Contract hash in UI matches `deployed/addresses.json`.

**Testing:**

- Cross-check displayed hashes against `deployed/addresses.json`.
- Open explorer links — contracts exist on testnet.

**Exit criteria:**

- Zero hardcoded contract hashes in component files.

---

### PHASE 6 — Dashboard Integration

**Objective:** Full holder/issuer dashboard with real indexed data.

**Tasks:**

1. Token list + detail from `/api/v1/tokens`.
2. Yield panel from `/api/v1/tokens/:hash/yield`.
3. YieldChart from `/api/v1/yields/history`.
4. ComplianceBadge from holder compliance endpoint.
5. Recent events feed from `/api/v1/events`.
6. Real-time refresh via SWR (30–60s interval; respect backend rate limits).

**Acceptance criteria:**

- Dashboard numbers change when backend index updates.
- Charts render real era/history data (may be sparse early — show honest empty states).

**Testing:**

- Compare dashboard yield value to direct `curl` against backend API.
- Visual check all widgets.

**Exit criteria:**

- Dashboard 100% live data.

---

### PHASE 7 — AI Integration

**Objective:** Surface live AI agent decisions in UI.

**Tasks:**

1. Agent decision feed from `GET /api/v1/decisions`.
2. Display agent name, decision type, hash, payload summary, approval status.
3. Display `attestation.publicKey` and `attestation.accountHash` when present.
4. Link audit summaries from `/api/v1/audit/summaries`.
5. Show yield/compliance/audit agent activity (agents run embedded in backend on Render).
6. Do NOT call OpenAI from browser — all AI is server-side.

**Acceptance criteria:**

- Decision feed shows real entries (yield, compliance, audit agents).
- Timestamps and hashes match backend API.

**Testing:**

- `curl` backend decisions endpoint vs UI display.

**Exit criteria:**

- AI section reflects live agent output.

---

### PHASE 8 — MCP Integration

**Objective:** Frontend can invoke MCP read tools and build unsigned txs via write tools.

**Tasks:**

1. Create server-side MCP client route (`frontend/app/api/mcp/route.ts` or tool-specific routes).
2. Connect to `NEXT_PUBLIC_MCP_SERVER_URL` / production MCP URL.
3. Implement UI for read tools (token info, yield, compliance, validators).
4. Implement write tool flow: call tool → display unsigned tx → pass to wallet sign flow.
5. Validate public key format before MCP calls.

**Acceptance criteria:**

- Read tools return live data in UI.
- Write tools produce unsigned TransactionV1 JSON displayed to user before signing.

**Testing:**

- Compare MCP `get_token_info` output to backend `/api/v1/tokens`.
- MCP Inspector parity check for each tool.

**Exit criteria:**

- All 12 MCP tools accessible from frontend (read in UI; write through sign flow).

---

### PHASE 9 — x402 Integration

**Objective:** Full paid resource flow in UI.

**Tasks:**

1. Implement `X402PaymentFlow` component.
2. Request paid resource → handle 402.
3. Sign payment per casper-eip-712 / x402 pattern.
4. Call `/verify` and `/settle` on combined x402 service.
5. Retry with `X-Payment` header.
6. Display settlement tx hash with explorer link.
7. Implement all 3 resource loops: yield-rate, validator-performance, sanctions-merkle.

**Acceptance criteria:**

- Unpaid request returns 402 UI state.
- Paid flow completes with on-chain settlement hash.
- Data displayed only after successful settlement.

**Testing:**

- Replicate `x402-facilitator/scripts/smoke-settle.mjs` flow from UI.
- Verify tx on `https://testnet.cspr.live/`.

**Exit criteria:**

- All 3 x402 resource loops work end-to-end from browser.

---

### PHASE 10 — Authentication & Security

**Objective:** Harden frontend security without backend changes.

**Tasks:**

1. Ensure `MERIDIAN_API_KEY` never in client bundle (`grep` + build analysis).
2. CORS: all backend access via Next.js proxy.
3. CSP headers via `next.config.ts`.
4. No `dangerouslySetInnerHTML` without sanitization.
5. Rate-limit client-side retry loops.
6. Validate all user inputs with Zod before MCP/backend calls.

**Acceptance criteria:**

- `next build` client bundle free of server secrets.
- Security grep from `docs/SECURITY_FINDINGS.md` passes for frontend.

**Testing:**

- Inspect `.next/static` chunks for leaked keys.
- OWASP basic checklist for dApp.

**Exit criteria:**

- Security review complete; no critical findings.

---

### PHASE 11 — Transactions

**Objective:** Complete on-chain transaction flows for all write operations.

**Tasks:**

1. Issue token: MCP `issue_token` → sign → submit → poll → refresh.
2. Transfer: MCP `transfer_token` → sign → submit.
3. Register/revoke holder: MCP tools → sign → submit.
4. Restake: MCP `restake` → sign → submit.
5. Distribute rewards: MCP `distribute_rewards` → sign → submit.
6. Transaction status component with real hash polling via RPC.
7. Error handling: insufficient balance, deploy failure, user reject.

**Acceptance criteria:**

- At least one successful testnet transaction per write tool type (or documented blocker).
- Transaction hashes verifiable on cspr.live.

**Testing:**

- Manual testnet txs with funded test wallet.
- E2E Playwright for primary happy path (issue or transfer).

**Exit criteria:**

- All write flows complete or blockers documented with STOP report.

---

### PHASE 12 — Testing & Production Readiness

**Objective:** Comprehensive test coverage against live backend.

**Tasks:**

1. Unit tests (Vitest): every component, hook, lib module.
2. E2E tests (Playwright): every page, route, modal.
3. Test matrix below (Section 13) — all rows must pass or be documented.
4. Lighthouse ≥ 90 on Performance, Accessibility, Best Practices, SEO.
5. `pnpm --filter frontend run build` clean.
6. Prepare Vercel deployment config (env vars documented — do not deploy unless instructed).
7. Write `docs/reports/FRONTEND_INTEGRATION_REPORT.md`.

**Acceptance criteria:**

- Full test matrix executed against live Render backend.
- Integration report complete with readiness score.

**Testing:**

- See Section 13.

**Exit criteria:**

- Frontend readiness score ≥ 90/100 OR blockers explicitly listed with STOP recommendation.

---

## 12. FRONTEND RULES — NON-NEGOTIABLE

1. **Never invent endpoints.** Use only paths in Section 6.
2. **Never rename APIs.** Path segments are fixed (`/api/v1/...`).
3. **Never rename contracts.** Use names from `deployed/addresses.json`.
4. **Never break interfaces.** Match backend `{ data }` and `{ error }` shapes.
5. **Never fake blockchain state.** All hashes from real RPC/submit responses.
6. **Never bypass wallet signing.** CSPR.click for every write operation.
7. **Never bypass x402.** Full verify → settle → access flow.
8. **Never bypass MCP** for transaction building. Backend has no tx build endpoints.
9. **Never expose secrets** in client bundles or `NEXT_PUBLIC_*`.
10. **Never modify forbidden systems** (Section 4).
11. **If something is missing — STOP and report.** Do not patch backend/contracts.

---

## 13. COMPLETE TEST MATRIX — EXECUTE AGAINST LIVE BACKEND

Test every row. Record pass/fail in integration report.

### 13.1 Pages & routes

| #   | Test                  | Expected                            |
| --- | --------------------- | ----------------------------------- |
| 1   | `GET /` landing loads | Real stats from backend             |
| 2   | `GET /dashboard`      | Live token + yield data             |
| 3   | `GET /issue`          | Form renders; MCP integration wired |
| 4   | `GET /audit`          | Real events + audit summaries       |
| 5   | `GET /agents`         | Real decisions feed                 |
| 6   | All modals open/close | No console errors                   |
| 7   | 404 page              | Graceful handling                   |
| 8   | Mobile responsive     | All pages usable                    |

### 13.2 Wallet flows

| #   | Test                  | Expected                 |
| --- | --------------------- | ------------------------ |
| 9   | Connect wallet        | CSPR.click modal         |
| 10  | Disconnect            | State cleared            |
| 11  | Wrong network warning | User notified            |
| 12  | Reject sign           | Error surfaced, no crash |
| 13  | Balance display       | Matches testnet          |

### 13.3 Backend integration

| #   | Test                   | Expected                  |
| --- | ---------------------- | ------------------------- |
| 14  | `/api/v1/tokens` proxy | 200 + data array          |
| 15  | Token detail           | 200 or 404 handled        |
| 16  | Yield endpoint         | Real yield data           |
| 17  | Yield history          | Chart renders             |
| 18  | Holders list           | Indexed holders           |
| 19  | Compliance lookup      | Real compliance row       |
| 20  | Events feed            | Indexed events            |
| 21  | Audit summaries        | Real summaries            |
| 22  | Decisions feed         | Agent decisions           |
| 23  | Backend cold start     | Loading UI ≥ 30s tolerant |

### 13.4 MCP tools (all 12)

| #   | Tool                  | Expected             |
| --- | --------------------- | -------------------- |
| 24  | get_token_info        | Live data            |
| 25  | get_yield_rate        | Live data            |
| 26  | get_holder_yield      | History data         |
| 27  | get_compliance_status | Compliance row       |
| 28  | list_validators       | Validator list       |
| 29  | subscribe_audit       | Audit feed or 402    |
| 30  | issue_token           | Unsigned tx returned |
| 31  | transfer_token        | Unsigned tx returned |
| 32  | register_holder       | Unsigned tx returned |
| 33  | revoke_holder         | Unsigned tx returned |
| 34  | restake               | Unsigned tx returned |
| 35  | distribute_rewards    | Unsigned tx returned |

### 13.5 x402 flows

| #   | Test                       | Expected                             |
| --- | -------------------------- | ------------------------------------ |
| 36  | Unpaid yield-rate          | HTTP 402                             |
| 37  | verify payment             | `{ valid: true }`                    |
| 38  | settle payment             | `{ success: true, transactionHash }` |
| 39  | Paid yield-rate            | Data returned                        |
| 40  | validator-performance loop | Full flow                            |
| 41  | sanctions-merkle loop      | Full flow                            |

### 13.6 Transactions

| #   | Test            | Expected              |
| --- | --------------- | --------------------- |
| 42  | Sign + submit   | Hash on explorer      |
| 43  | Tx polling      | Finalized status      |
| 44  | Failed tx       | Error displayed       |
| 45  | Post-tx refresh | UI updates from index |

### 13.7 UI states

| #   | Test              | Expected           |
| --- | ----------------- | ------------------ |
| 46  | Loading skeletons | Every async widget |
| 47  | Empty states      | Honest "no data"   |
| 48  | Error states      | Retry option       |
| 49  | Rate limit 429    | Graceful backoff   |
| 50  | Network offline   | User message       |

### 13.8 Infrastructure verification

| #   | System         | Verify via                          |
| --- | -------------- | ----------------------------------- |
| 51  | Supabase       | Backend `/ready` → postgres.ok      |
| 52  | Upstash        | Backend `/ready` → upstash.ok       |
| 53  | CSPR.cloud     | Backend `/ready` → cspr_cloud.ok    |
| 54  | Casper testnet | Backend `/ready` → rpc.ok           |
| 55  | AI agents      | `/api/v1/decisions` has recent rows |
| 56  | Indexer        | `/health` events_indexed > 0        |

---

## 14. FINAL DELIVERABLE — INTEGRATION REPORT

Create exactly:

```
docs/reports/FRONTEND_INTEGRATION_REPORT.md
```

### Required sections

```markdown
# MERIDIAN Frontend Integration Report

## Executive Summary

## Connected Pages (route → data sources)

## APIs Used (exact endpoints)

## Contracts Used (package hashes from deployed/addresses.json)

## Wallet Integration (CSPR.click version, network, flows tested)

## MCP Integration (tools tested, session transport)

## x402 Integration (loops tested, settlement hashes)

## AI Integration (decision feed, audit summaries)

## Mock Removal Verification (grep results)

## Test Matrix Results (Section 13 — all 56 rows)

## Performance (Lighthouse scores, SWR cache config)

## Security Notes (secret scan, CSP, proxy pattern)

## Remaining Issues (if any — with STOP recommendations)

## Frontend Readiness Score (0–100 with breakdown)
```

Scoring guide:

| Area                    | Weight |
| ----------------------- | ------ |
| Mock removal            | 15%    |
| Backend API integration | 20%    |
| Wallet + transactions   | 20%    |
| MCP integration         | 15%    |
| x402 integration        | 15%    |
| Testing + security      | 15%    |

**GO threshold:** ≥ 90/100 with zero critical blockers.

---

## 15. EXECUTION COMMANDS REFERENCE

```bash
# Verify env
./scripts/verify-env.sh
node scripts/verify-agent-identity.mjs
pnpm verify:agent-identity

# Build frontend
pnpm --filter frontend run build

# Dev server
pnpm --filter frontend run dev

# Unit tests
pnpm --filter frontend run test

# E2E tests (live backend)
BACKEND_URL=https://meridian-backend-cu88.onrender.com \
MERIDIAN_API_KEY=<from .env> \
pnpm --filter frontend exec playwright test

# Mock grep (must be zero)
rg -i "mock|fake|placeholder|demo" frontend/ --glob '!**/*.test.*'

# Secret leak check
rg "MERIDIAN_API_KEY|CASPER_API_KEY|SUPABASE_SERVICE" frontend/app frontend/components

# Backend health
curl -s https://meridian-backend-cu88.onrender.com/ready | jq .

# MCP health
curl -s https://meridian-mcp-server-94q4.onrender.com/health | jq .

# x402 health
curl -s https://meridian-x402-facilitator.onrender.com/health | jq .
```

---

## 16. STOP CONDITIONS

HALT execution and write integration report with blockers if:

- Backend `/ready` returns non-200 persistently after cold-start wait.
- MCP `/health` unavailable.
- x402 `/supported` unavailable.
- Required env var missing from `.env`.
- MCP write tool schema changed without frontend update path.
- CSPR.click SDK incompatible with Next.js 16 / React 19.
- Any requirement demands modifying forbidden systems (Section 4).

Do not proceed with mocks as fallback. Do not proceed with fake data "temporarily."

---

## 17. SUCCESS DEFINITION

You succeed when:

1. All mock/demo/fake code is removed.
2. Every page renders real data from backend, chain, MCP, or x402.
3. Wallet connects and signs real TransactionV1 on Casper testnet.
4. All 12 MCP tools are exercised.
5. All 3 x402 payment loops settle on-chain.
6. AI agent decisions visible in UI.
7. Section 13 test matrix ≥ 95% pass (document failures).
8. `docs/reports/FRONTEND_INTEGRATION_REPORT.md` published with readiness score.
9. Zero modifications outside `frontend/` and the integration report.

---

**BEGIN EXECUTION WITH PHASE 1 — FRONTEND AUDIT.**

**DO NOT MODIFY BACKEND, CONTRACTS, MCP, x402, AGENTS, OR DEPLOYMENT.**

**DO NOT USE MOCK DATA.**

**WHEN IN DOUBT — STOP AND REPORT.**
