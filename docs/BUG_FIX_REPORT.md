# MERIDIAN Bug Fix Report

**Version:** 1.0  
**Date:** July 7, 2026  
**Maintainer:** Engineering  
**Status legend:** **Fixed** = merged in repo; **Open** = reproducible or environmental; **Mitigated** = partial workaround

---

## Summary

| Severity  | Fixed | Open  | Mitigated |
| --------- | ----- | ----- | --------- |
| P0        | 1     | 1     | 0         |
| P1        | 4     | 2     | 1         |
| P2        | 2     | 4     | 0         |
| **Total** | **7** | **7** | **1**     |

---

## P0 — Production Blockers

### BUG-001: Planner execute fails on write tools (MODULE_NOT_FOUND)

| Field            | Detail                                                                                                                                                                                                                                                                       |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**       | **Fixed** (awaiting redeploy verification)                                                                                                                                                                                                                                   |
| **Severity**     | P0                                                                                                                                                                                                                                                                           |
| **Symptom**      | `POST /api/v1/planner/execute` with delegate objective returns error referencing missing `mcp-server/dist/casper/tx-builder.js`                                                                                                                                              |
| **Reproduction** | `bash curl -sS -X POST https://meridian-backend-ikx8.onrender.com/api/v1/planner/execute \   -H "Content-Type: application/json" \   -H "Authorization: Bearer $MERIDIAN_API_KEY" \   -d '{"objective":"Delegate 500 CSPR to the best validator. My public key is 01..."}' ` |
| **Root cause**   | Render backend `buildCommand` compiled `@meridian/backend` without first building `@meridian/mcp-server`. Runtime `write-tool-invoker.ts` dynamically requires compiled tx-builder from MCP package.                                                                         |
| **Evidence**     | Old build scripts in `scripts/render-free-backend.mjs` omitted mcp-server; deployed artifact lacked `mcp-server/dist/casper/tx-builder.js`                                                                                                                                   |
| **Fix**          | 1. `render.yaml` line 12: `pnpm --filter @meridian/mcp-server run build` in backend service buildCommand                                                                                                                                                                     |
|                  | 2. `backend/package.json` build script: `pnpm --filter @meridian/mcp-server run build && tsc ...`                                                                                                                                                                            |
|                  | 3. `backend/src/planner/resolve-tx-builder.ts`: multi-path candidate resolution before throw                                                                                                                                                                                 |
| **Files**        | `render.yaml`, `backend/package.json`, `backend/src/planner/resolve-tx-builder.ts`, `backend/src/planner/write-tool-invoker.ts`                                                                                                                                              |
| **Verification** | Redeploy backend; re-run curl delegate objective; expect `unsignedTransaction` in response                                                                                                                                                                                   |

---

### BUG-002: Backend health degraded — indexer lag

| Field               | Detail                                                                                                                 |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **Status**          | **Open** (environmental)                                                                                               |
| **Severity**        | P0 (data freshness)                                                                                                    |
| **Symptom**         | `/health` returns `"status":"degraded"` with `indexer_lag.ok: false`                                                   |
| **Live evidence**   | `2026-07-07T03:32:30Z`: `"indexer_lag":{"ok":false,"detail":"88684 blocks"}` — RPC height 8,421,862                    |
| **Impact**          | Yield APY, distribution history, briefing insight show stale or empty values                                           |
| **Files**           | `backend/src/indexer/*`, Render env `INDEXER_*`                                                                        |
| **Recommended fix** | Trigger backfill (`INDEXER_BACKFILL_ON_START=true` once), or reset indexer cursor; surface degraded banner in frontend |

---

## P1 — User-Facing Incorrect State

### BUG-003: Pending actions count included agent decisions

| Field            | Detail                                                                                                                                     |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Status**       | **Fixed**                                                                                                                                  |
| **Severity**     | P1                                                                                                                                         |
| **Symptom**      | Briefing "Pending actions" card showed **7** when user had no wallet approval pending                                                      |
| **Root cause**   | Prior logic counted pending items from agent decision feed                                                                                 |
| **Fix**          | `frontend/lib/hooks/useBriefingData.ts` lines 72–73: `pendingCount` only when `unsignedTxPending` or runtime phase is `wallet` / `waiting` |
| **Verification** | Open `/agent` with idle runtime → pending shows `0`                                                                                        |

---

### BUG-004: StatusRibbon hardcoded MCP tool count

| Field            | Detail                                                                                                         |
| ---------------- | -------------------------------------------------------------------------------------------------------------- |
| **Status**       | **Fixed**                                                                                                      |
| **Severity**     | P1                                                                                                             |
| **Symptom**      | Ribbon always displayed "13 tools" even when MCP unreachable                                                   |
| **Fix**          | `frontend/src/design/components/StatusRibbon.tsx` uses `useMcpHealth()` hook; shows "MCP connecting" when null |
| **Files**        | `StatusRibbon.tsx`, `frontend/lib/hooks/useMcpHealth.ts`                                                       |
| **Verification** | Disable MCP → ribbon shows connecting; live MCP → dynamic count matches `/health`                              |

---

### BUG-005: `/agents` route redirected to `/activity`

| Field            | Detail                                                                                     |
| ---------------- | ------------------------------------------------------------------------------------------ |
| **Status**       | **Fixed**                                                                                  |
| **Severity**     | P1                                                                                         |
| **Symptom**      | Sidebar "Agents" nav landed on History page                                                |
| **Fix**          | Commit `fdfe9e0` — restored `AgentsPage` at `frontend/src/app/(dashboard)/agents/page.tsx` |
| **Verification** | Navigate to `/agents` → specialist employee cards render                                   |

---

### BUG-006: Marketplace "Agent Console" dead link

| Field            | Detail                                                                                               |
| ---------------- | ---------------------------------------------------------------------------------------------------- |
| **Status**       | **Fixed**                                                                                            |
| **Severity**     | P1                                                                                                   |
| **Symptom**      | Post-install CTA linked to non-existent agent console route                                          |
| **Fix**          | `frontend/src/dashboard/pages/MarketplacePage.tsx` success alert links to `/agent` ("Open briefing") |
| **Verification** | Install template → click link → lands on briefing                                                    |

---

### BUG-007: Contract calls used wrong hash method (historical)

| Field         | Detail                                                                            |
| ------------- | --------------------------------------------------------------------------------- |
| **Status**    | **Fixed** (prior sprint)                                                          |
| **Severity**  | P0 on-chain                                                                       |
| **Symptom**   | MCP-built transactions failed at deploy with invalid contract reference           |
| **Fix**       | `mcp-server/src/casper/tx-builder.ts` — `.byPackageHash()` instead of `.byHash()` |
| **Reference** | `docs/reports/BLOCKCHAIN_TRANSACTION_ROOT_CAUSE_REPORT.md`                        |

---

## P2 — Routing and Orphans

### BUG-008: Redirect-shadowed routes serve stale bookmarks

| Field              | Detail                                                                                        |
| ------------------ | --------------------------------------------------------------------------------------------- |
| **Status**         | **Open** (by design, needs doc sync)                                                          |
| **Severity**       | P2                                                                                            |
| **Routes**         | `/missions` → `/templates`, `/playground` → `/agent`, `/prompts` → `/examples`                |
| **File**           | `frontend/next.config.mjs` lines 45–47                                                        |
| **Impact**         | Skill file and external links reference old paths; page components exist but URLs change      |
| **Recommendation** | Update `frontend/public/meridian-skill.md`, `skills/MERIDIAN/SKILL.md`; decide canonical URLs |

---

### BUG-009: AgentConsolePage unreachable

| Field              | Detail                                                            |
| ------------------ | ----------------------------------------------------------------- |
| **Status**         | **Open**                                                          |
| **Severity**       | P2                                                                |
| **Symptom**        | Full execution console UI built but no App Router page imports it |
| **File**           | `frontend/src/dashboard/pages/AgentConsolePage.tsx`               |
| **Recommendation** | Mount at `/console` or merge into `/agent` per UX plan            |

---

### BUG-010: Auth pages 404 in Next.js app

| Field              | Detail                                                                                                     |
| ------------------ | ---------------------------------------------------------------------------------------------------------- |
| **Status**         | **Open** (low priority — wallet auth)                                                                      |
| **Severity**       | P2                                                                                                         |
| **Symptom**        | `/authentication/login` and `/authentication/sign-up` return 404                                           |
| **Root cause**     | Auth only wired in legacy Nickelfox React Router (`frontend/src/nickelfox/routes/router.tsx`), not Next.js |
| **Recommendation** | Remove dead links or add Next.js auth routes if product requires email login                               |

---

### BUG-011: TokensPage orphan

| Field        | Detail                                                                |
| ------------ | --------------------------------------------------------------------- |
| **Status**   | **Open**                                                              |
| **Severity** | P2                                                                    |
| **File**     | `frontend/src/dashboard/pages/TokensPage.tsx` — Nickelfox placeholder |
| **Note**     | `/dashboard/tokens` redirects to `/issue`                             |

---

### BUG-012: Duplicate pipeline components; legacy console orphaned

| Field          | Detail                                                                                                                      |
| -------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **Status**     | **Open** (partial)                                                                                                          |
| **Severity**   | P2                                                                                                                          |
| **Symptom**    | `AgentExecutionConsole` remains unreachable; two pipeline implementations coexist                                           |
| **Evidence**   | `AgentPipeline` wired in `AgentHomePage.tsx` (lines 237–249); `AgentExecutionConsole` only in orphan `AgentConsolePage.tsx` |
| **Fix target** | Consolidate on `AgentPipeline`; delete or redirect `AgentConsolePage`                                                       |

---

## Mitigated / Environmental

### BUG-013: Render free-tier cold starts

| Field          | Detail                                                            |
| -------------- | ----------------------------------------------------------------- |
| **Status**     | **Mitigated**                                                     |
| **Symptom**    | First request after idle timeout slow or 502                      |
| **Mitigation** | Frontend `useHealth` / SWR retry; StatusRibbon shows "Connecting" |
| **Long-term**  | Paid plan or keep-warm cron                                       |

---

## Fix Verification Checklist

| ID      | Check                            | Pass criteria                                    |
| ------- | -------------------------------- | ------------------------------------------------ |
| BUG-001 | Backend redeploy + delegate curl | Returns planner steps with `unsignedTransaction` |
| BUG-002 | `/health` indexer_lag            | `ok: true` or UI degraded banner                 |
| BUG-003 | Briefing idle                    | Pending actions = 0                              |
| BUG-004 | MCP down/up                      | Ribbon reflects live tool count                  |
| BUG-005 | `/agents`                        | AgentsPage renders                               |
| BUG-006 | Marketplace install              | Link to `/agent` works                           |
| BUG-012 | Delegate from `/agent`           | Pipeline stages visible                          |

---

## Related Documents

- `docs/PRODUCT_AUDIT.md` — route and UX context
- `docs/FINAL_QA_REPORT.md` — test matrix
- `docs/reports/BLOCKCHAIN_TRANSACTION_ROOT_CAUSE_REPORT.md` — on-chain tx fixes
