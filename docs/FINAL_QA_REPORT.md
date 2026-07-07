# MERIDIAN Final QA Report

**Version:** 1.0  
**Date:** July 7, 2026  
**Environment:** Production (Render + Vercel)  
**Backend:** `https://meridian-backend-ikx8.onrender.com`  
**MCP:** `https://meridian-mcp-server-94q4.onrender.com`  
**Frontend:** `https://meridian-frontend-kappa.vercel.app`

---

## Executive Summary

MERIDIAN passes **core read-path QA** across 14 dashboard routes, MCP health (13 tools), wallet connect/sign flow, and frontend bug fixes (pending actions, StatusRibbon, `/agents` route, marketplace link). **Write-path planner execution** was blocked in production by a missing `mcp-server` build artifact (P0, fix merged, redeploy pending). Backend health is **degraded** due to indexer lag (~88k blocks), affecting yield/distribution freshness—not a frontend regression.

| Area                   | Result                                          |
| ---------------------- | ----------------------------------------------- |
| Frontend routes        | **14/14 working** (3 legacy URLs redirect)      |
| MCP integration        | **Pass** — 13 tools live                        |
| Wallet                 | **Pass**                                        |
| Planner read missions  | **Pass**                                        |
| Planner write missions | **Blocked pre-fix** — verify post-redeploy      |
| Backend health         | **Degraded** — indexer lag                      |
| Build (monorepo)       | **Pass** with mcp-server in backend build chain |

---

## Build Status

### Render services (`render.yaml`)

| Service               | Build includes mcp-server? | Start command                                               | Health               |
| --------------------- | -------------------------- | ----------------------------------------------------------- | -------------------- |
| `meridian-backend`    | **Yes** (line 12)          | `bash scripts/start-backend.sh`                             | `/health` — degraded |
| `meridian-mcp-server` | Yes                        | `MERIDIAN_MCP_TRANSPORT=http node mcp-server/dist/index.js` | `/health` — ok       |
| `meridian-x402`       | No (not required)          | Combined facilitator                                        | `/health`            |

### Backend package build (`backend/package.json`)

```json
"build": "pnpm --filter @meridian/mcp-server run build && tsc -p tsconfig.json && ..."
```

Ensures `mcp-server/dist/casper/tx-builder.js` exists before backend compile.

### Frontend (Vercel)

| Check                | Status                                                    |
| -------------------- | --------------------------------------------------------- |
| Next.js build        | Pass (`eslint.ignoreDuringBuilds: true`)                  |
| MCP dist tracing     | `next.config.mjs` includes mcp-server dist for `/api/mcp` |
| Transpile CSPR Click | Configured in `transpilePackages`                         |

### Local verification commands

```bash
pnpm install --frozen-lockfile
pnpm --filter @meridian/mcp-server run build
pnpm --filter @meridian/backend run build
pnpm --filter @meridian/frontend run build
```

---

## Live Health Evidence

**Timestamp:** 2026-07-07T03:32:30Z

### Backend `/health`

```json
{
  "status": "degraded",
  "checks": {
    "postgres": { "ok": true },
    "rpc": { "ok": true, "detail": "height=8421862" },
    "cspr_cloud": { "ok": true },
    "upstash": { "ok": true },
    "indexer_stream": { "ok": true, "detail": "connected" },
    "indexer_lag": { "ok": false, "detail": "88684 blocks" },
    "events_indexed": { "ok": true, "detail": "6 events" }
  }
}
```

### MCP `/health`

```json
{
  "status": "ok",
  "transport": "http",
  "tools": 13,
  "toolNames": [
    "get_token_info",
    "get_yield_rate",
    "get_holder_yield",
    "get_compliance_status",
    "list_validators",
    "subscribe_audit",
    "transfer_token",
    "register_holder",
    "revoke_holder",
    "delegate_stake",
    "deposit_to_vault",
    "restake",
    "distribute_rewards"
  ]
}
```

---

## Frontend Route Test Matrix

| Route                   | HTTP             | Component loads       | API data              | Notes                      |
| ----------------------- | ---------------- | --------------------- | --------------------- | -------------------------- |
| `/`                     | 200              | LandingPage           | —                     | Marketing entry            |
| `/agent`                | 200              | AgentHomePage         | Planner, traces, KPIs | Pipeline via AgentPipeline |
| `/activity`             | 200              | ActivityPage          | Events, traces        |                            |
| `/agents`               | 200              | AgentsPage            | Decisions, traces     | Fixed from redirect        |
| `/start`                | 200              | SetupWizard (7 steps) | MCP health            |                            |
| `/templates`            | 200              | MissionsPage          | Static library        |                            |
| `/examples`             | 200              | ExamplesPage          | Static prompts        |                            |
| `/marketplace`          | 200              | MarketplacePage       | Profile local         | Link → `/agent` fixed      |
| `/dashboard`            | 200              | DashboardPage         | KPIs                  |                            |
| `/issue`                | 200              | Issue page            | Token API             |                            |
| `/staking`              | 200              | Staking page          | Yield API             |                            |
| `/compliance`           | 200              | Compliance page       | Registry API          |                            |
| `/audit`                | 200              | Audit page            | Events                |                            |
| `/mcp`                  | 200              | MCP page              | Tool catalog          |                            |
| `/x402`                 | 200              | x402 page             | Facilitator           |                            |
| `/missions`             | 307→`/templates` | Redirect              | —                     | Shadowed                   |
| `/playground`           | 307→`/agent`     | Redirect              | —                     | Shadowed                   |
| `/prompts`              | 307→`/examples`  | Redirect              | —                     | Shadowed                   |
| `/authentication/login` | 404              | —                     | —                     | Orphan Nickelfox auth      |

---

## Functional Test Matrix

| ID   | Test case               | Steps                                    | Expected                       | Result                                             |
| ---- | ----------------------- | ---------------------------------------- | ------------------------------ | -------------------------------------------------- |
| T-01 | Setup wizard MCP verify | Complete steps 1–4 on `/start`           | Green check, tools > 0         | **Pass**                                           |
| T-02 | Read mission            | `/agent` → "What is MRWA yield APY?"     | Result bubble, phase complete  | **Pass**                                           |
| T-03 | Pending actions idle    | Load `/agent` with no unsigned tx        | Pending = 0                    | **Pass** (fix verified)                            |
| T-04 | StatusRibbon tools      | Load any page with ribbon                | Live tool count from MCP       | **Pass** (fix verified)                            |
| T-05 | Agents page             | Nav → Agents                             | Specialist cards, not redirect | **Pass** (fix verified)                            |
| T-06 | Marketplace install     | Install template → CTA                   | Opens `/agent` briefing        | **Pass** (fix verified)                            |
| T-07 | Wallet connect          | CSPR Click connect on `/start` or topbar | Account label shown            | **Pass**                                           |
| T-08 | Delegate write mission  | Wallet connected → delegate 500 CSPR     | ApprovalPrompt → tx hash       | **Fail pre-fix** (MODULE_NOT_FOUND)                |
| T-09 | Planner post-fix        | Re-run T-08 after backend redeploy       | Unsigned tx returned           | **Pending redeploy**                               |
| T-10 | SSE traces              | Run mission, open `/activity`            | Trace events appear            | **Pass**                                           |
| T-11 | Command palette         | ⌘K → navigate routes                     | All primary routes reachable   | **Pass**                                           |
| T-12 | Degraded backend UX     | Check briefing during indexer lag        | Stale yield / honest insight   | **Partial** — shows "No distributions indexed yet" |
| T-13 | MCP Cursor integration  | Copy config, list tools in Cursor        | 13 tools                       | **Pass** (manual)                                  |
| T-14 | x402 audit              | subscribe_audit without payment          | 402 hint                       | **Pass** (by design)                               |

---

## Bug Fix Verification

| Bug ID  | Description                 | QA result                                  |
| ------- | --------------------------- | ------------------------------------------ |
| BUG-001 | tx-builder MODULE_NOT_FOUND | Fix in repo; **await production redeploy** |
| BUG-003 | Pending actions count       | **Verified fixed**                         |
| BUG-004 | Hardcoded 13 tools          | **Verified fixed**                         |
| BUG-005 | `/agents` redirect          | **Verified fixed**                         |
| BUG-006 | Marketplace dead link       | **Verified fixed**                         |

Full register: `docs/BUG_FIX_REPORT.md`.

---

## Integration Test Matrix

| Integration          | Endpoint / path                | Status                         |
| -------------------- | ------------------------------ | ------------------------------ |
| Planner execute      | `POST /api/v1/planner/execute` | Read OK; write blocked pre-fix |
| MCP health (proxied) | `GET /api/mcp/health`          | OK                             |
| Backend ready        | `GET /ready`                   | OK (used by StatusRibbon)      |
| Protocol KPIs        | Dashboard hooks                | OK (may be stale)              |
| Wallet sign          | CSPR Click SDK                 | OK                             |
| SSE traces           | Trace stream endpoint          | OK                             |
| x402 facilitator     | Separate Render service        | OK                             |

---

## Remaining Gaps

### P0 — Must close before write demo

| Gap                                    | Owner    | Action                                                    |
| -------------------------------------- | -------- | --------------------------------------------------------- |
| Backend redeploy with mcp-server build | Platform | Deploy latest `render.yaml` + backend build               |
| Indexer lag 88k+ blocks                | Backend  | Backfill or reset cursor; set `INDEXER_BACKFILL_ON_START` |

### P1 — UX completeness

| Gap                       | File(s)                         | Action                             |
| ------------------------- | ------------------------------- | ---------------------------------- |
| Degraded banner not shown | `AgentHomePage`, `StatusRibbon` | Surface when health.status !== ok  |
| Pre-sign simulation       | `ApprovalPrompt`                | Add simulation stage before wallet |
| Redirect-shadowed URLs    | `next.config.mjs`, skill docs   | Canonical URL cleanup              |

### P2 — Cleanup

| Gap                                         | Action                              |
| ------------------------------------------- | ----------------------------------- |
| Orphan `AgentConsolePage`                   | Remove or mount                     |
| Orphan `TokensPage`, `DashboardNavbar`      | Delete legacy                       |
| Auth pages 404                              | Remove links or implement           |
| `PlaygroundPage`, `PromptsPage` unreachable | Restore routes or delete components |

---

## Regression Watchlist

| Risk                  | Trigger                                   | Mitigation                          |
| --------------------- | ----------------------------------------- | ----------------------------------- |
| tx-builder path drift | Backend deploy without mcp-server build   | CI check for artifact existence     |
| False pending count   | Re-introducing decision count in briefing | Unit test on `useBriefingData`      |
| MCP count drift       | New tools without health update           | MCP `/health` auto-lists tools      |
| Indexer lag           | CSPR.cloud stream gaps                    | Alert on `indexer_lag.ok === false` |

---

## Sign-Off Checklist

- [x] 14 dashboard routes render
- [x] MCP 13 tools confirmed live
- [x] Wallet connect/sign path verified
- [x] Frontend audit fixes verified (pending, ribbon, agents, marketplace)
- [x] 7-step setup wizard functional
- [ ] Planner write mission end-to-end on production (post-redeploy)
- [ ] Backend health `ok` (indexer caught up)
- [ ] Redirect-shadowed routes documented in skill files

---

## Related Documents

- `docs/PRODUCT_AUDIT.md` — full route matrix
- `docs/BUG_FIX_REPORT.md` — defect status
- `docs/AGENT_EXPERIENCE_SPEC.md` — pipeline and approval flows
- `docs/DEPLOYMENT_RENDER.md` — deployment procedures
