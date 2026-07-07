# MERIDIAN Product Audit

**Version:** 1.0  
**Date:** July 7, 2026  
**Scope:** Frontend routes, navigation, UX quality, orphan components, live integration status  
**Evidence sources:** `frontend/next.config.mjs`, `frontend/src/app/**`, live health probes, planner execute curl reproduction

---

## Executive Summary

MERIDIAN is a production Casper agent stack (Planner API, 13 MCP tools, wallet signing, x402, SSE traces, indexer-backed reads). The frontend exposes a dual-surface architecture: a **chat-first briefing** (`/agent`) and an **institutional operations layer** (`/dashboard`, `/staking`, `/compliance`, etc.). Most routes render and call real backend APIs. Three legacy paths are redirect-shadowed, four component trees are orphaned from routing, and the deployed backend remains **degraded** due to indexer lag—not a frontend defect, but visible in briefing KPIs.

---

## Route Matrix

### Primary dashboard routes (Next.js App Router)

| Route          | Page component                                     | Nav visible            | Status      | Backend integration                 | Notes                                                              |
| -------------- | -------------------------------------------------- | ---------------------- | ----------- | ----------------------------------- | ------------------------------------------------------------------ |
| `/`            | `frontend/src/views/LandingPage.tsx`               | N/A (marketing)        | **Working** | None                                | Entry point; links into app                                        |
| `/agent`       | `frontend/src/dashboard/pages/AgentHomePage.tsx`   | Yes — Briefing         | **Working** | Planner execute, SSE traces, wallet | Primary agent OS surface                                           |
| `/activity`    | `frontend/src/dashboard/pages/ActivityPage.tsx`    | Yes — History          | **Working** | Events, traces                      | Pipeline replay limited                                            |
| `/agents`      | `frontend/src/dashboard/pages/AgentsPage.tsx`      | Yes — Agents           | **Working** | Decisions, SSE traces               | Previously redirected to `/activity`; restored in commit `fdfe9e0` |
| `/start`       | `frontend/src/design/components/SetupWizard.tsx`   | Yes — Setup            | **Working** | `/api/mcp/health`, wallet           | 7-step onboarding wizard                                           |
| `/templates`   | `frontend/src/dashboard/pages/MissionsPage.tsx`    | Yes — Templates        | **Working** | Static mission library              | Canonical path for missions                                        |
| `/examples`    | `frontend/src/dashboard/pages/ExamplesPage.tsx`    | Yes — Examples         | **Working** | Static prompts                      | Canonical path for prompts                                         |
| `/marketplace` | `frontend/src/dashboard/pages/MarketplacePage.tsx` | Yes — Marketplace      | **Working** | Agent profile (local)               | Dead "Agent Console" link fixed → `/agent`                         |
| `/dashboard`   | `frontend/src/dashboard/pages/DashboardPage.tsx`   | Yes — Operations       | **Working** | Protocol KPIs, events               | Best institutional overview                                        |
| `/issue`       | Issue page                                         | Via Operations sidebar | **Working** | Token registry API                  | Replaces legacy `/dashboard/tokens`                                |
| `/staking`     | Staking page                                       | Via Operations sidebar | **Working** | Yield, vault APIs                   |                                                                    |
| `/compliance`  | Compliance page                                    | Via Operations sidebar | **Working** | Compliance registry                 |                                                                    |
| `/audit`       | Audit page                                         | Via Operations sidebar | **Working** | CEP-88 events, x402                 |                                                                    |
| `/mcp`         | MCP explorer page                                  | Yes — MCP Tools        | **Working** | `/api/mcp/health`, tool catalog     |                                                                    |
| `/x402`        | x402 page                                          | Hidden (power user)    | **Working** | x402 facilitator                    | Premium audit unlock                                               |

**Count:** 14 user-facing dashboard routes render with real or static-but-functional content.

### Redirect-shadowed routes

Defined in `frontend/next.config.mjs` (`redirects()`):

| Source        | Destination  | Page file still exists?    | Impact                                                               |
| ------------- | ------------ | -------------------------- | -------------------------------------------------------------------- |
| `/missions`   | `/templates` | Yes — `MissionsPage.tsx`   | Bookmarks to `/missions` work but URL changes; nav uses `/templates` |
| `/playground` | `/agent`     | Yes — `PlaygroundPage.tsx` | Playground component built but unreachable at canonical URL          |
| `/prompts`    | `/examples`  | Yes — `PromptsPage.tsx`    | Prompt library page exists; external docs may reference `/prompts`   |

Additional legacy redirects (all `permanent: false`):

- `/dashboard/*` → flat routes (e.g. `/dashboard/staking` → `/staking`)
- `/dashboard/agent` → `/agent`, `/dashboard/activity` → `/activity`

### Broken / unreachable routes

| Route                       | Expected         | Actual       | Root cause                                                                                                                                                                                 |
| --------------------------- | ---------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/authentication/login`     | Nickelfox login  | **404**      | Auth pages live in `frontend/src/nickelfox/pages/authentication/` but are wired only to the legacy React Router shell (`frontend/src/nickelfox/routes/router.tsx`), not Next.js App Router |
| `/authentication/sign-up`   | Nickelfox signup | **404**      | Same as above                                                                                                                                                                              |
| `/agent-console` (implicit) | Agent console    | **No route** | `AgentConsolePage.tsx` is implemented but never mounted in `frontend/src/app/`                                                                                                             |

---

## Orphan Components

Components that exist in the codebase but are not reachable through the primary Next.js route tree:

| Component          | Path                                                    | Built features                                                               | Recommendation                                           |
| ------------------ | ------------------------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------- |
| `AgentConsolePage` | `frontend/src/dashboard/pages/AgentConsolePage.tsx`     | Full runtime UI with `AgentExecutionConsole`, trace timeline, wallet signing | Mount at `/console` or merge pipeline into `/agent`      |
| `TokensPage`       | `frontend/src/dashboard/pages/TokensPage.tsx`           | Nickelfox `TopProducts` placeholder                                          | Superseded by `/issue`; delete or redirect               |
| `DashboardNavbar`  | `frontend/src/dashboard/components/DashboardNavbar.tsx` | Horizon-style top nav                                                        | Superseded by `DashboardShellLayout` + Nickelfox sidebar |
| `PlaygroundPage`   | `frontend/src/dashboard/pages/PlaygroundPage.tsx`       | Demo objective runner                                                        | Either remove redirect or restore `/playground`          |
| `PromptsPage`      | `frontend/src/dashboard/pages/PromptsPage.tsx`          | Master prompt catalog                                                        | Either remove redirect or restore `/prompts`             |

Auth pages (`Login.tsx`, `SignUp.tsx`) are excluded from Next.js compilation paths in `frontend/tsconfig.json` (nickelfox auth folder referenced only for type exclusion).

---

## Navigation Audit

### Current sidebar (`frontend/src/nickelfox/data/nav-items.ts`)

| Group     | Items                                                          |
| --------- | -------------------------------------------------------------- |
| Workspace | Briefing (`/agent`), Agents (`/agents`), History (`/activity`) |
| Discover  | Templates, Examples, Marketplace                               |
| More      | Setup, Operations, MCP Tools                                   |

### Legacy sidebar (`frontend/src/dashboard/routes.tsx`)

Seven institutional routes used by `CommandPalette` and the Operations sub-nav: Overview, Tokens→`/issue`, Staking, Compliance, AI Agents, Audit, MCP Tools.

### IA gaps

| Issue                                   | Severity | Detail                                                                                  |
| --------------------------------------- | -------- | --------------------------------------------------------------------------------------- |
| Institutional depth hidden under "More" | Medium   | `/dashboard`, `/staking`, `/compliance`, `/audit`, `/x402` not in primary nav           |
| Redirect confusion                      | Low      | `/missions`, `/prompts`, `/playground` documented in skill files but shadowed           |
| Dual nav systems                        | Medium   | Nickelfox sidebar + legacy `dashboardRoutes` + Command Palette — three sources of truth |
| Chat framing on briefing                | Medium   | `/agent` still reads as chat column, not full OS briefing despite `BriefingGrid`        |

---

## UX Issues (Evidence-Based)

### Fixed in current codebase

| Issue                             | Symptom                                                       | Fix location                                                                                                    | Status    |
| --------------------------------- | ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | --------- |
| Pending actions inflated          | Briefing showed **7** pending items from agent decision queue | `frontend/lib/hooks/useBriefingData.ts` — counts only `unsignedTxPending` and runtime phases `wallet`/`waiting` | **Fixed** |
| StatusRibbon hardcoded tool count | Always displayed "13 tools" regardless of MCP health          | `frontend/src/design/components/StatusRibbon.tsx` + `frontend/lib/hooks/useMcpHealth.ts`                        | **Fixed** |
| `/agents` redirect                | Nav item pointed to `/activity`                               | Route restored; `AgentsPage` at `frontend/src/app/(dashboard)/agents/page.tsx` (commit `fdfe9e0`)               | **Fixed** |
| Marketplace dead link             | "Agent Console" pointed to non-existent route                 | `MarketplacePage.tsx` success alert links to `/agent`                                                           | **Fixed** |

### Open UX issues

| Issue                                   | Severity | Evidence                                                                                                                        |
| --------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Duplicate pipeline UIs                  | Low      | `AgentPipeline` active on `/agent`; legacy `AgentExecutionConsole` only in orphan `AgentConsolePage`                            |
| Backend degraded state                  | High     | Live `/health`: `indexer_lag` ~88,684 blocks → yield/distribution cards show stale or zero data                                 |
| Wallet sync in profile                  | Medium   | Profile panel can show "No wallet" while topbar shows connected (reported in redesign audit)                                    |
| Simulation step missing                 | Medium   | `ApprovalPrompt` (`frontend/src/components/agent/ApprovalPrompt.tsx`) shows transaction review but no pre-sign simulation stage |
| Institutional pages low discoverability | Medium   | Judges/operators must use ⌘K or "More" to find `/dashboard`                                                                     |
| Auth pages 404                          | Low      | No product auth flow in Next.js app; wallet is sole identity                                                                    |

---

## Live Integration Status

Probed **2026-07-07T03:32:30Z**:

| Service               | URL                                                    | Status       | Detail                                                                              |
| --------------------- | ------------------------------------------------------ | ------------ | ----------------------------------------------------------------------------------- |
| Backend               | `https://meridian-backend-ikx8.onrender.com/health`    | **Degraded** | Postgres, RPC, CSPR.cloud, Upstash OK; `indexer_lag` failed (~88,684 blocks behind) |
| MCP server            | `https://meridian-mcp-server-94q4.onrender.com/health` | **OK**       | 13 tools, HTTP transport                                                            |
| Wallet (Casper Click) | Frontend integration                                   | **OK**       | Connect, sign, broadcast confirmed in manual QA                                     |

MCP tool names (live): `get_token_info`, `get_yield_rate`, `get_holder_yield`, `get_compliance_status`, `list_validators`, `subscribe_audit`, `transfer_token`, `register_holder`, `revoke_holder`, `delegate_stake`, `deposit_to_vault`, `restake`, `distribute_rewards`.

---

## Backend P0: Planner Write Path (Cross-Cutting)

Although not a frontend defect, this blocked all write missions from the briefing:

| Field      | Value                                                                                                                          |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Endpoint   | `POST https://meridian-backend-ikx8.onrender.com/api/v1/planner/execute`                                                       |
| Objective  | Delegate stake (e.g. "Delegate 500 CSPR")                                                                                      |
| Error      | `MODULE_NOT_FOUND` for `mcp-server/dist/casper/tx-builder.js`                                                                  |
| Root cause | Render backend build omitted `@meridian/mcp-server` compile step                                                               |
| Fix        | `render.yaml` line 12 + `backend/package.json` build script; `backend/src/planner/resolve-tx-builder.ts` multi-path resolution |

See `docs/BUG_FIX_REPORT.md` for full remediation record.

---

## Priority Recommendations

| Priority | Action                                                                      | Owner              |
| -------- | --------------------------------------------------------------------------- | ------------------ |
| P0       | Redeploy backend with mcp-server build; verify delegate mission end-to-end  | Platform           |
| P0       | Address indexer lag or surface honest "stale data" banner on briefing       | Backend + Frontend |
| P1       | Wire `AgentExecutionConsole` into `/agent` using `PIPELINE_STAGES`          | Frontend           |
| P1       | Resolve redirect-shadowed routes: pick canonical URLs and update skill/docs | Frontend           |
| P2       | Remove or route orphan pages (`AgentConsolePage`, `TokensPage`, auth)       | Frontend           |
| P2       | Consolidate nav to single source (`nav-items.ts`)                           | Frontend           |

---

## Related Documents

- `docs/BUG_FIX_REPORT.md` — defect register with fix status
- `docs/UX_REDESIGN_PLAN.md` — design system and page priorities
- `docs/FINAL_QA_REPORT.md` — test matrix and remaining gaps
