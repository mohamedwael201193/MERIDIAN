# MERIDIAN Project Execution Plan

Status: Phase 1 complete — awaiting approval before Phase 2  
Created: 2026-06-28  
Updated: 2026-06-28 (cloud-first architecture)  
Scope: Smart contracts, backend, database, infrastructure, agents, MCP, event indexer, wallet transaction integration, CSPR.cloud integration, x402, AI Toolkit integration, observability, CI/CD, deployment  
Out of scope until separately approved: frontend implementation (future target: Vercel)

---

## 1. Executive Summary

MERIDIAN is a production-grade Casper 2.x backend and smart contract system for institutional real-world assets with native staking yield, compliance enforcement, AI-assisted operations, MCP-based agent access, and x402-paid machine-to-machine workflows.

**Cloud-first infrastructure (no local Docker, PostgreSQL, or Redis):**

| Layer               | Provider                          |
| ------------------- | --------------------------------- |
| Backend hosting     | Render                            |
| Database            | Supabase PostgreSQL               |
| Cache / queue       | Upstash Redis                     |
| Blockchain          | Casper Testnet                    |
| RPC + events        | CSPR.cloud                        |
| AI (primary)        | OpenAI (Anthropic optional later) |
| Frontend (deferred) | Vercel                            |

The system uses live Casper 2.x capabilities only: TransactionV1, Zug finality, CEP-88 native events, CSPR.cloud event consumption, Contract Access to Auction, Native Access Controls, CEP-18 v1.2.0-compatible fungible token behavior, Odra 2.8.2, and Casper x402/EIP-712 payment patterns.

Execution proceeds one phase at a time. Each phase ends with verification, `PHASE_N_REPORT.md`, and a hard stop for human approval.

---

## 2. Cloud Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Casper Testnet (on-chain)                    │
│   MeridianToken │ StakingVault │ Compliance │ Yield │ Audit     │
└────────────────────────────┬────────────────────────────────────┘
                             │ TransactionV1 / CEP-88 events
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                        CSPR.cloud                                │
│              RPC (node.cspr.cloud) + REST/SSE (api.cspr.cloud)   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Render (backend + agents + MCP)               │
│   Fastify API │ Event Indexer │ AI Agents │ MCP Server │ x402   │
└──────┬──────────────────────────────┬───────────────────────────┘
       │                              │
       ▼                              ▼
┌──────────────────┐        ┌──────────────────┐
│ Supabase         │        │ Upstash Redis    │
│ PostgreSQL       │        │ REST / pub-sub   │
└──────────────────┘        └──────────────────┘
       │
       ▼
┌──────────────────┐
│ OpenAI API       │  (Anthropic optional later)
└──────────────────┘
```

Trust boundaries:

- Contracts hold protocol state and enforce permissions.
- Backend never fabricates chain data; it indexes and queries real on-chain events/state.
- MCP server is non-custodial.
- Agents use role-scoped keys only.
- Private keys live only in PEM files or Render secrets, never code, logs, or database rows.
- Supabase and Upstash credentials are server-side only.

---

## 3. Live Official Verification Findings

Confirmed current pins:

- `casper-node`: v2.2.1
- `odra`: `=2.8.2`
- `cargo-odra`: `=0.1.7`
- `casper-client`: `=5.0.1`
- `casper-js-sdk`: `5.0.12`
- `casper-eip-712`: `1.2.0` with `casper-native`
- `@modelcontextprotocol/sdk`: latest stable at phase start
- `@x402/axios` / `@x402/mcp`: v2.x at phase start

Protocol requirements unchanged: TransactionV1, CEP-88 native events, CSPR.cloud for RPC/SSE, `get_global_state` (not deprecated `get_state_item`), Contract Access to Auction, x402 v2 payment flows, MCP spec `2025-11-25`.

---

## 4. Environment Requirements (Cloud-First)

### 4.1 Required for Phase 1 (development environment)

| Variable                             | Purpose                                         | Mandatory Phase 1 |
| ------------------------------------ | ----------------------------------------------- | ----------------- |
| `CASPER_NETWORK`                     | Target network                                  | Yes               |
| `CASPER_RPC_URL`                     | CSPR.cloud RPC                                  | Yes               |
| `CASPER_CHAIN_NAME`                  | TransactionV1 chain name                        | Yes               |
| `CASPER_API_KEY`                     | CSPR.cloud auth                                 | Yes               |
| `CASPER_SIDE_CAR_URL`                | CSPR.cloud REST/SSE base                        | Yes               |
| `DATABASE_URL`                       | Supabase PostgreSQL connection string           | Yes               |
| `SUPABASE_URL`                       | Supabase project URL                            | Yes               |
| `SUPABASE_ANON_KEY`                  | Supabase anon key (client-safe, server may use) | Yes               |
| `SUPABASE_SERVICE_ROLE_KEY`          | Supabase service role (server only)             | Yes               |
| `UPSTASH_REDIS_REST_URL`             | Upstash Redis REST endpoint                     | Yes               |
| `UPSTASH_REDIS_REST_TOKEN`           | Upstash Redis REST token                        | Yes               |
| `OPENAI_API_KEY` or `openai_api_key` | OpenAI API (primary AI)                         | Yes               |

### 4.2 Required before later phases (not blocking Phase 1)

| Variable                                               | Required before             |
| ------------------------------------------------------ | --------------------------- |
| `MERIDIAN_DEPLOYER_PUBLIC_KEY` / `deployer_public_key` | Phase 4 (testnet deploy)    |
| `MERIDIAN_DEPLOYER_PRIVATE_KEY_PEM`                    | Phase 4                     |
| `MERIDIAN_DEPLOYER_ACCOUNT_HASH`                       | Phase 4                     |
| Agent key variables                                    | Phase 6                     |
| `ANTHROPIC_API_KEY`                                    | Phase 6 (optional fallback) |
| `GOOGLE_API_KEY`                                       | Phase 6 (optional fallback) |
| `X402_PAYMENT_TOKEN_CONTRACT_HASH`                     | Phase 7                     |
| `NEXT_PUBLIC_*`                                        | Frontend phase (Vercel)     |

### 4.3 Deprecated / replaced in cloud architecture

- **Removed:** `docker-compose.yml`, local PostgreSQL, local Redis, `REDIS_URL` pointing to `localhost` (replace with Upstash REST vars for production).
- **No Docker** required on developer machines for MERIDIAN infrastructure.

Secrets policy: never overwrite existing `.env` values; never regenerate; never expose in logs or reports.

---

## 5. Repository Structure

```text
MERIDIAN/
├── Cargo.toml
├── package.json
├── pnpm-workspace.yaml
├── rust-toolchain.toml
├── justfile
├── .env.example
├── .gitignore
├── .editorconfig
├── .prettierrc
├── eslint.config.js
├── tsconfig.base.json
├── lefthook.yml
├── .github/workflows/ci.yml
├── scripts/
│   ├── bootstrap.sh
│   ├── verify-env.sh
│   └── verify-phase1.mjs
├── packages/
│   ├── meridian-env/          # Zod env schema (no business logic)
│   └── meridian-ts-types/     # Generated later
├── contracts/                   # Phase 2+
│   ├── meridian-token/
│   ├── staking-vault/
│   ├── compliance-registry/
│   ├── yield-distributor/
│   └── meridian-audit/
├── backend/                     # Phase 5+ (skeleton in Phase 1)
├── agents/                      # Phase 6+ (skeleton in Phase 1)
├── mcp-server/                  # Phase 7+ (skeleton in Phase 1)
├── x402-facilitator/            # Phase 7+
├── deployed/
│   └── addresses.json
├── docs/
│   └── ARCHITECTURE.md
├── tests/
│   ├── integration/
│   ├── gas-analysis/
│   ├── benchmarks/
│   ├── security/
│   └── performance/
└── PHASE_*_REPORT.md
```

No `docker-compose.yml`. No frontend directory until Vercel phase.

---

## 6. Contract Architecture

(Unchanged — see prior specification.)

Five Odra 2.8.2 contracts: `MeridianToken`, `StakingVault`, `ComplianceRegistry`, `YieldDistributor`, `MeridianAudit`. TransactionV1 only. CEP-88 events. Contract Access to Auction via dynamic `system::get_auction()`.

Contract integration tests run against Casper Testnet (Phase 3+) — not local nctl/Docker.

---

## 7. Database Architecture (Supabase PostgreSQL)

Supabase PostgreSQL is the durable query and event store. Migrations run from backend against `DATABASE_URL`. Row Level Security policies applied where Supabase client is used; backend service uses direct PostgreSQL connection with service role for indexer writes.

Core schemas: `schema_migrations`, `contracts`, `transactions`, `indexed_events`, `tokens`, `holders`, `compliance_events`, `staking_positions`, `yield_distributions`, `validator_snapshots`, `agent_decisions`, `audit_summaries`, `x402_payments`.

Rules: indexer ordering key is `block_height + event_index`; startup backfills from last indexed block; all API reads trace to chain or indexed events.

---

## 8. Backend Architecture (Render)

- Node.js 20+ on Render Web Service.
- TypeScript strict, Fastify (version pinned in Phase 1).
- `casper-js-sdk 5.0.12`.
- PostgreSQL via `pg` → Supabase `DATABASE_URL`.
- Upstash Redis via `@upstash/redis` REST client (not local `ioredis` to localhost).
- OpenAI SDK as primary AI client.
- Validation: `zod`. Logging: `pino`. Metrics: `prom-client`.

Health checks verify: Supabase connectivity, Upstash connectivity, CSPR.cloud RPC, CSPR.cloud REST, OpenAI reachability.

---

## 9. AI Agent Architecture

Primary provider: **OpenAI**. Anthropic and Google are optional fallbacks configured only if keys are present.

Agents deploy as separate Render background workers or combined service per cost/ops decision in Phase 6.

---

## 10. MCP Architecture

MCP server deploys on Render (HTTP) with stdio mode for local Claude Desktop development. Non-custodial write tools return unsigned TransactionV1 payloads.

---

## 11. Integration Architecture

| Integration         | Endpoint / method                                     |
| ------------------- | ----------------------------------------------------- |
| Casper RPC          | `CASPER_RPC_URL` + `CASPER_API_KEY`                   |
| CSPR.cloud REST/SSE | `CASPER_SIDE_CAR_URL` + `CASPER_API_KEY`              |
| Supabase DB         | `DATABASE_URL` (direct Postgres)                      |
| Upstash             | `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` |
| OpenAI              | `OPENAI_API_KEY`                                      |
| x402                | Casper testnet + facilitator (Phase 7)                |

---

## 12. Deployment Architecture

### Development (Phase 1)

- WSL/Linux/macOS with Rust stable, Node 20+, pnpm, `cargo-odra`, `casper-client`.
- Cloud services: Supabase, Upstash, CSPR.cloud, OpenAI — no local DB/Redis/Docker.

### Staging / Production (Render)

- **Backend Web Service** on Render: build `backend/`, start command `node dist/index.js`, env vars from Render dashboard (mirror `.env` keys).
- **Background workers** (agents, indexer) on Render as separate services or combined per phase decision.
- **Database:** Supabase project (same `DATABASE_URL` for staging; separate project for production).
- **Cache:** Upstash Redis (separate database for production).
- **MCP HTTP:** Render Web Service on dedicated port/path.
- **Frontend (later):** Vercel, env vars `NEXT_PUBLIC_*`.

### Casper Testnet

- Contracts deployed via `casper-client 5.0.1` + TransactionV1.
- Hashes in `deployed/addresses.json`.

### CI/CD (GitHub Actions)

- Rust: `fmt`, `clippy -D warnings`, `test`.
- TypeScript: `lint`, `typecheck`, `test`.
- Env validation script (dry-run against CI secrets or skip external checks in CI with mock gate).
- No Docker build steps.
- Render deploy triggered manually or via Render GitHub integration after phase approval.

---

## 13. Dependency Graph

```
Rust toolchain → Odra contracts → WASM → testnet deploy → TS types
Supabase migrations → backend indexer → APIs → agents/MCP
CSPR.cloud RPC/SSE → indexer → Supabase
Upstash → agent coordination / rate limits
OpenAI → agent reasoning
Render → hosts all Node services
```

Critical path: Phase 1 env → Phase 2 contracts → Phase 3 testnet contract tests → Phase 4 deploy → Phase 5 backend on Supabase → Phase 6 agents → Phase 7 MCP/x402 → Phase 8 E2E → Phase 9 QA.

---

## 14. Execution Order

1. **Phase 1:** Cloud-ready development environment (no business logic).
2. **Phase 2:** Smart contracts.
3. **Phase 3:** Contract testing against Casper Testnet.
4. **Phase 4:** Testnet deployment.
5. **Phase 5:** Backend + indexer (Supabase + Upstash + Render-ready).
6. **Phase 6:** AI agents (OpenAI primary).
7. **Phase 7:** MCP + x402 facilitator.
8. **Phase 8:** End-to-end integration (cloud + testnet).
9. **Phase 9:** Production QA + Render deployment + hackathon readiness.

Before each phase: re-check official Casper/Odra/npm versions and breaking changes.

---

## 15. Phase Breakdown (Detailed)

### Phase 1: Cloud-Ready Development Environment

**Objectives**

1. Validate all Phase 1 environment variables.
2. Validate Supabase, Upstash, Casper RPC, CSPR.cloud, OpenAI connectivity.
3. Validate Rust/Cargo/Odra/casper-client toolchain.
4. Create repository skeleton, lint/format/test/CI/git-hook infrastructure.
5. Document cloud architecture. No smart contracts, backend logic, or frontend.

**Deliverables**

- Monorepo scaffold (directories, workspace configs).
- `rust-toolchain.toml`, root `Cargo.toml`, `package.json`, `pnpm-workspace.yaml`.
- `packages/meridian-env` with Zod env schema.
- `scripts/verify-env.sh`, `scripts/verify-phase1.mjs`.
- `.env.example` reflecting cloud vars.
- ESLint, Prettier, rustfmt, clippy config.
- Vitest smoke test infrastructure.
- GitHub Actions CI workflow.
- Lefthook pre-commit hooks.
- `docs/ARCHITECTURE.md`.
- `PHASE_1_REPORT.md`.

**Dependencies**

- User-populated `.env` with Supabase, Upstash, CSPR.cloud, OpenAI credentials.
- Rust stable + wasm target installed locally.
- Git repository initialized.

**Acceptance Criteria**

- All Phase 1 env vars present and valid (or documented as deferred with reason).
- Supabase `SELECT 1` succeeds via `DATABASE_URL`.
- Upstash REST `PING` succeeds.
- Casper RPC `info_get_status` returns `casper-test`.
- CSPR.cloud REST health/authenticated call succeeds.
- OpenAI models list or minimal API call succeeds.
- `cargo fmt --check`, `pnpm lint`, `pnpm typecheck`, `pnpm test` pass on skeleton.
- CI workflow validates on push.
- Zero business logic implemented.

**Testing Checklist**

- [ ] `scripts/verify-env.sh` — all Phase 1 checks pass
- [ ] `node scripts/verify-phase1.mjs` — cloud connectivity pass
- [ ] `cargo fmt --check`
- [ ] `cargo clippy -- -D warnings` (workspace empty OK)
- [ ] `pnpm lint`
- [ ] `pnpm typecheck`
- [ ] `pnpm test` (skeleton smoke tests)
- [ ] Lefthook install + dry-run

**Exit Criteria**

- `PHASE_1_REPORT.md` generated with readiness score ≥ 80%.
- Human approval before Phase 2.

**Estimated Complexity:** Medium (1–2 days)

---

### Phase 2: Smart Contracts

**Objectives:** Implement five Odra 2.8.2 contracts with full tests, events, access control.

**Deliverables:** Five contract crates, WASM artifacts, unit/property/fuzz/permission tests.

**Dependencies:** Phase 1 approved; deployer keys funded before Phase 4 only.

**Acceptance Criteria:** `cargo odra build`, zero warnings, all contract tests pass, WASM < 200 KB each.

**Testing Checklist:** fmt, clippy, unit, property, fuzz, permission, overflow, event, upgrade tests.

**Exit Criteria:** `PHASE_2_REPORT.md` + approval.

**Estimated Complexity:** High (5–8 days)

---

### Phase 3: Contract Testing (Casper Testnet)

**Objectives:** Integration, gas, benchmark, security tests against live Casper Testnet (no local nctl/Docker).

**Deliverables:** Testnet integration test suite, `docs/GAS_ANALYSIS.md`, `docs/BENCHMARKS.md`.

**Dependencies:** Phase 2 approved; funded deployer account.

**Acceptance Criteria:** All integration tests pass on testnet; gas report from real transactions.

**Testing Checklist:** lifecycle, restake, revoke, adversarial, access control, replay, upgrade safety.

**Exit Criteria:** `PHASE_3_REPORT.md` + approval.

**Estimated Complexity:** High (3–5 days)

---

### Phase 4: Testnet Deployment

**Objectives:** Deploy all contracts; verify on CSPR.live; generate TS types.

**Deliverables:** `deployed/addresses.json`, deploy scripts, `@meridian/ts-types`.

**Dependencies:** Phase 3 approved; deployer PEM + funded account.

**Acceptance Criteria:** Five contracts live on testnet with recorded transaction hashes.

**Testing Checklist:** deploy script, verify script, testnet smoke test.

**Exit Criteria:** `PHASE_4_REPORT.md` + approval.

**Estimated Complexity:** Medium (1–2 days)

---

### Phase 5: Backend + Event Indexer (Supabase + Upstash + Render-ready)

**Objectives:** Fastify backend, Supabase migrations, CSPR.cloud indexer, Upstash coordination, health/metrics.

**Deliverables:** Deployable backend package, migrations, indexer, API routes, Render `render.yaml` or deploy docs.

**Dependencies:** Phase 4 approved; Supabase + Upstash + CSPR.cloud operational.

**Acceptance Criteria:** Migrations applied to Supabase; indexer writes real events; `/health` 200; Render deploy dry-run documented.

**Testing Checklist:** unit, integration (Supabase test schema), Sidecar reconnect/backfill, API contract tests.

**Exit Criteria:** `PHASE_5_REPORT.md` + approval.

**Estimated Complexity:** High (5–7 days)

---

### Phase 6: AI Agents (OpenAI primary)

**Objectives:** YieldAgent, ComplianceAgent, AuditAgent with schema-validated OpenAI calls.

**Deliverables:** Three agent services, shared runtime, Upstash pub/sub, decision recording.

**Dependencies:** Phase 5 approved; OpenAI key; agent keys funded.

**Acceptance Criteria:** Agents start; AuditAgent blocks bad YieldAgent decision; decisions hashed.

**Testing Checklist:** prompt schema, fallback (if keys present), adversarial, rate limit.

**Exit Criteria:** `PHASE_6_REPORT.md` + approval.

**Estimated Complexity:** High (4–6 days)

---

### Phase 7: MCP Server + x402 Facilitator

**Objectives:** Non-custodial MCP on Render; x402 facilitator; three payment loops on testnet.

**Deliverables:** MCP server (stdio + HTTP), x402 fork, integration tests.

**Dependencies:** Phase 6 approved; x402 payment token deployed.

**Acceptance Criteria:** MCP Inspector passes; x402 verify/settle on testnet.

**Testing Checklist:** tool list, unsigned tx builders, x402 replay/policy tests.

**Exit Criteria:** `PHASE_7_REPORT.md` + approval.

**Estimated Complexity:** High (4–5 days)

---

### Phase 8: End-to-End Integration

**Objectives:** Full lifecycle on testnet + cloud stack; performance tests.

**Deliverables:** E2E test suite, load tests for indexer and x402.

**Dependencies:** Phases 1–7 approved.

**Acceptance Criteria:** Real testnet lifecycle; 100 x402 queries settle; indexer lag within target.

**Testing Checklist:** full lifecycle, multi-agent, x402 load, deposit/distribution load.

**Exit Criteria:** `PHASE_8_REPORT.md` + approval.

**Estimated Complexity:** Medium–High (3–4 days)

---

### Phase 9: Production QA + Render Deployment

**Objectives:** Security review, docs, Render production deploy, hackathon package.

**Deliverables:** RUNBOOK, API.md, SECURITY.md, Render services live, demo assets.

**Dependencies:** Phase 8 approved.

**Acceptance Criteria:** All quality gates; Render backend healthy; no Critical/High findings open.

**Testing Checklist:** cargo/npm audit, smoke on Render URL, rollback drill.

**Exit Criteria:** `PHASE_9_REPORT.md` + hackathon submission ready.

**Estimated Complexity:** Medium (2–3 days)

---

## 16. Testing Strategy (Cloud-First)

| Layer                | Environment                               |
| -------------------- | ----------------------------------------- |
| Unit tests           | Local CI + developer machine              |
| Contract integration | Casper Testnet (real transactions)        |
| Backend integration  | Supabase (project or branch DB) + Upstash |
| Agent tests          | OpenAI live API (test prompts)            |
| MCP/x402             | Testnet settlement                        |
| E2E                  | Render staging + testnet                  |
| Performance          | Render staging + Supabase + Upstash       |

No local PostgreSQL, Redis, or Docker required. CI uses GitHub Actions with optional secrets for cloud connectivity checks on `main` only.

---

## 17. Deployment Strategy (Cloud-First)

1. Phase 1: validate cloud credentials locally.
2. Phase 2–4: build and deploy contracts to Casper Testnet.
3. Phase 5: apply Supabase migrations; configure Render backend service.
4. Phase 6–7: deploy agents and MCP as Render services.
5. Phase 8: E2E against Render staging URL + testnet.
6. Phase 9: promote to Render production; separate Supabase/Upstash prod instances.
7. Frontend (later): Vercel deploy with `NEXT_PUBLIC_*` env vars.

Render secrets mirror `.env` keys. Never commit secrets. Use Render environment groups for staging/production separation.

---

## 18. Monitoring Plan (Render + Cloud)

**Render:** built-in logs, health checks, autoscaling metrics.

**Application metrics (Prometheus-compatible):**

- `meridian_events_indexed_total`
- `meridian_indexer_lag_blocks`
- `meridian_rpc_errors_total`
- `meridian_sidecar_reconnects_total`
- `meridian_upstash_errors_total`
- `meridian_supabase_query_duration_ms`
- `meridian_agent_decisions_total`
- `meridian_openai_requests_total`
- `meridian_x402_payments_total`

**Alerts:** Render health check failures, Supabase connection errors, Upstash failures, indexer lag, RPC outages, OpenAI rate limits.

**Supabase dashboard:** connection count, query performance, storage.

**Upstash dashboard:** command count, latency, memory.

---

## 19. Risk Analysis

| Risk                                       | Mitigation                                                                      |
| ------------------------------------------ | ------------------------------------------------------------------------------- |
| Supabase connection limits on free tier    | Connection pooling (PgBouncer built into Supabase); upgrade tier for production |
| Upstash REST latency vs native Redis       | Accept REST for serverless Render; monitor p95                                  |
| CSPR.cloud rate limits                     | Exponential backoff; cache reads in Upstash                                     |
| Render cold starts                         | Keep-alive health pings; minimum instance count on prod                         |
| Missing deployer/agent keys before Phase 4 | Document in Phase 1 report; defer until user maps PEM paths                     |
| `REDIS_URL` still pointing to localhost    | Migrate to Upstash vars; deprecate `REDIS_URL` in code                          |

---

## 20. Rollback Strategy

- **Render:** rollback to previous deploy via Render dashboard (instant).
- **Supabase:** forward migrations only; document down migrations in phase reports.
- **Contracts:** versioned packages in `deployed/addresses.json`; pause admin ops on bad deploy.
- **Upstash:** flush keys via namespaced prefixes per environment.

---

## 21. Global Acceptance Criteria

- No mock data, fake transactions, placeholder functions, or TODOs.
- No compiler/linter warnings.
- All dependencies exact-pinned.
- Secrets never logged or committed.
- Every phase produces `PHASE_N_REPORT.md` and stops for approval.

---

## 22. Success Checklist

**Phase 1 complete when:**

- [ ] Cloud connectivity verified (Supabase, Upstash, CSPR.cloud, OpenAI)
- [ ] Toolchain verified (Rust, Odra, casper-client)
- [ ] Repository skeleton + CI + hooks configured
- [ ] `PHASE_1_REPORT.md` approved

**Before Render production:**

- [ ] Backend deployed and `/health` returns 200 on Render URL
- [ ] Supabase migrations applied
- [ ] Indexer caught up on testnet events
- [ ] All testnet contract hashes recorded

---

## 23. Approval Gate

Phase 1 may proceed after this plan update. No smart contract, backend business logic, or frontend work until Phase 1 report is approved.
