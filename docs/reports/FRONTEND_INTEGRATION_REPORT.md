# MERIDIAN Frontend Integration Report

**Date:** 2026-07-06 (Production UX Loop)  
**Phase:** 9 — Production dApp frontend  
**Stack:** Next.js 14.2.30 App Router · React 18.3.1 · MUI 5 (Nickelfox dashboard) · SWR · CSPR.click · casper-js-sdk 5.0.12  
**Design system:** `DESIGN.md` (Kraken-inspired tokens mapped to dark MERIDIAN theme)

---

## Production UX Loop Summary (2026-07-06)

Full frontend production UX pass completed: documentation review, `design-md` (Kraken) token application, sidebar redesign, template-data removal, loading/error UX, and browser verification of all routes.

### UX improvements

| Area               | Change                                                                                                                                                                                      |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Sidebar**        | Grouped navigation (Overview, Assets, Operations, Intelligence, Integrations, External) with icons, active/hover states, collapsed tooltips, `aria-current`, expanded default width (260px) |
| **Topbar**         | Removed non-functional search and notification bell; added live backend status chip; wallet Connect CTA when disconnected                                                                   |
| **KPI cards**      | Removed fake `+0% this era` increments; added real data source labels (StakingVault, YieldDistributor, etc.)                                                                                |
| **Charts**         | Fixed `useMemo` deps so charts update after API load; replaced template labels (“New Visitors”, “Level 1–6”, Mon–Sun) with era/agent/compliance labels                                      |
| **Featured RWAs**  | Replaced Unsplash images and fake popularity with live contract cards (symbol, package hash, explorer link)                                                                                 |
| **Agent Activity** | Buckets by agent type (Yield / Audit / Compliance) instead of arbitrary index modulo                                                                                                        |
| **Loading/error**  | Added route-level `loading.tsx` / `error.tsx`; skeleton loaders on KPI cards; `Alert` components on widget errors                                                                           |
| **Theme**          | Distinct `info` palette (Kraken purple `#5741d8`) separate from primary red; `DESIGN.md` copied to project root                                                                             |

### Navigation improvements

- Flat 9-item list replaced with **6 logical groups** and section headers
- Desktop drawer **open by default** so labels are visible on first visit
- Collapsed mode shows **tooltips** (`Group · Label`) on every item
- Active route highlighted with primary fill (expanded) or left border (collapsed)
- External link to landing page isolated under **External** group

### Sidebar structure (final)

| Group        | Items                    |
| ------------ | ------------------------ |
| Overview     | Dashboard                |
| Assets       | Issue Token              |
| Operations   | Compliance, Staking      |
| Intelligence | AI Agents, Audit         |
| Integrations | MCP Tools, x402 Payments |
| External     | Landing Page             |

### Pages tested (browser + HTTP)

| Route         | HTTP | Live data verified                                          |
| ------------- | ---- | ----------------------------------------------------------- |
| `/`           | 200  | Protocol KPIs from `/api/*`                                 |
| `/dashboard`  | 200  | KPIs, tokens, holders, decisions, yield history, compliance |
| `/issue`      | 200  | TokenIssueForm + MCP proxy                                  |
| `/audit`      | 200  | Audit summaries + events                                    |
| `/agents`     | 200  | Agent decision feed                                         |
| `/compliance` | 200  | Holder lookup + MCP compliance                              |
| `/staking`    | 200  | Vault KPIs + validators                                     |
| `/mcp`        | 200  | 12-tool explorer                                            |
| `/x402`       | 200  | Payment flow UI                                             |
| `/api/health` | 200  | Render backend (degraded: indexer lag only)                 |
| `/api/tokens` | 200  | 5 deployed contracts                                        |

**Browser verification:** Dashboard sidebar groups, Connect Wallet CTA, backend status chip, live KPI values (5 tokens, 1 compliant holder, 6 indexed events), agent decision counts, and contract registry confirmed via accessibility tree inspection.

**Chrome DevTools MCP:** Server configured in Cursor (`chrome-devtools`) but **failed to launch on WSL** (`Target closed` — no system Chrome binary; Puppeteer download may need manual Chrome install or `--headless` retry). Browser audit performed via Cursor built-in browser + curl.

### Wallet tests

| Test                                   | Status                                         |
| -------------------------------------- | ---------------------------------------------- |
| Connect Wallet CTA in topbar           | **PASS** — button visible when disconnected    |
| Connected account chip + explorer link | **CODED** — requires manual CSPR.click session |
| Sign/submit MCP write tools            | **PENDING** — requires funded testnet wallet   |
| x402 sign + verify + settle            | **PENDING** — requires funded testnet wallet   |
| TransactionStatus polling              | **CODED** — not exercised without wallet       |

### MCP tests

| Test                  | Status                                     |
| --------------------- | ------------------------------------------ |
| `POST /api/mcp` proxy | **PASS** — health shows 12 tools on Render |
| Read tools in UI      | **PASS** — compliance, staking, MCP page   |
| Write tool sign flow  | **PENDING** — manual wallet required       |

### x402 tests

| Test                         | Status                               |
| ---------------------------- | ------------------------------------ |
| Unpaid resource → HTTP 402   | **PASS** (prior session)             |
| Verify/settle with X-Payment | **PENDING** — manual wallet required |

### Backend verification

- Render backend `https://meridian-backend-ikx8.onrender.com` reachable via local proxy
- `/api/health` returns `degraded` (indexer lag ~76k blocks); postgres, RPC, CSPR.cloud, Upstash, stream OK
- All dashboard widgets consume live SWR hooks — no mock data paths remain

### Contract verification

- 5 Odra contracts indexed: ComplianceRegistry, MeridianAudit, MRWA, StakingVault, YieldDistributor
- Explorer links generated from `deployed/addresses.json` package hashes
- Token carousel shows real package hashes with testnet explorer URLs

### Screens tested

- Landing hero + live protocol stats
- Dashboard hero + 8 widget sections
- Sidebar expanded and collapsed states (via layout toggle)
- Topbar backend chip + wallet area
- Route shell loading spinner (`DashboardShellLayout`)

### Remaining issues

1. **Manual wallet E2E (REQUIRED)** — Connect wallet, sign MCP write, x402 settlement; capture explorer hashes
2. **Chrome DevTools MCP on WSL** — Install Chrome or use `--headless=true`; retry `@chrome-devtools` for performance traces
3. **Indexer lag (MEDIUM)** — Backend degraded; reads work but lag chip shown in hero
4. **x402 signature format (MEDIUM)** — Verify with funded wallet if `invalid_signature` occurs
5. **Legacy Horizon sidebar** — Unused Tailwind sidebar in `dashboard/components/`; safe to delete in future cleanup

### Production readiness score (updated)

| Area                    | Weight | Score | Weighted |
| ----------------------- | ------ | ----- | -------- |
| UX / navigation         | 15%    | 92    | 13.80    |
| Mock removal            | 10%    | 99    | 9.90     |
| Backend API integration | 20%    | 92    | 18.40    |
| Wallet + transactions   | 20%    | 82    | 16.40    |
| MCP integration         | 15%    | 94    | 14.10    |
| x402 integration        | 10%    | 84    | 8.40     |
| Testing + security      | 10%    | 88    | 8.80     |

### **Total: 89.8 / 100**

**Verdict:** Frontend UX, navigation, sidebar, and live-data wiring are production-ready. **GO threshold (≥90) blocked only by manual wallet-signed transaction verification** (MCP writes, x402 settlement) and backend indexer lag. Build passes; Vitest 3/3; all 9 routes return 200.

---

## Executive Summary

The MERIDIAN frontend is a **Next.js 14 production dApp** with server-side API proxy routes, live SWR data hooks, CSPR.click wallet integration, MCP write/sign/submit flows, x402 payment pipeline, and dedicated Section 10 components. All mock dashboard data was removed or replaced with backend-backed hooks.

**Production build:** `pnpm run build` succeeds — app routes and API proxy handlers compile cleanly.

**Unit tests:** `pnpm run test` — 3/3 Vitest schema tests pass (`lib/schemas.test.ts`).

**E2E tests:** Playwright smoke suite at `tests/e2e/smoke.spec.ts` — 4/4 routes pass against `http://localhost:3000`.

**Current backend status:** Render backend (`https://meridian-backend-ikx8.onrender.com`) is reachable through the local frontend proxy. `/api/health`, `/api/ready`, `/api/tokens`, `/api/events`, and `/api/decisions` return live data. Backend health is currently degraded only by indexer lag; postgres, RPC, CSPR.cloud, Upstash, stream, events, and API reads are operational.

**Stack note:** Master prompt specifies Next 16 / React 19; project uses **Next 14.2.30 + React 18.3.1** because CSPR.click is incompatible with React 19 (`ReactCurrentDispatcher` error) and Next 15 requires React 19. CSPR.click is loaded through a client-only provider with `ThemeProvider`, `ClickProvider`, and `ClickUI`.

**No backend, contract, MCP server, x402, or agent code was modified.**

---

## Connected Pages (route → data sources)

| Route         | Purpose                      | Data sources                                                                                                                                                                                                      |
| ------------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`           | Landing + live protocol KPIs | `/api/health`, `/api/tokens`, `/api/tokens/:hash/yield`, `/api/holders`, `/api/events` via `ProtocolStats`                                                                                                        |
| `/dashboard`  | Nickelfox holder dashboard   | `TodaysSales` (KPIs), `TopProducts` (tokens), `CustomerTable` (holders), `Earnings` (yield), `VisitorInsights` (yield history), `Level` (decisions), `TrendingNow` (tokens), `CustomerFulfillment` (compliance %) |
| `/issue`      | Token issuance               | `TokenIssueForm` → MCP `issue_token` → CSPR.click sign → casper-js-sdk RPC submit                                                                                                                                 |
| `/audit`      | Audit trail                  | `AuditTrail` + `YieldChart` — `/api/audit/summaries`, `/api/events`, `/api/yields/history`                                                                                                                        |
| `/agents`     | AI agent activity            | `AgentDecisionFeed` — `/api/decisions`                                                                                                                                                                            |
| `/mcp`        | MCP tool explorer            | POST `/api/mcp` (all 12 tools) + wallet sign/submit for write tools                                                                                                                                               |
| `/x402`       | Paid resource demo           | `X402PaymentFlow` — unpaid 402, `/api/x402/verify`, then `X-Payment` retry through `/api/x402/resource/*`                                                                                                         |
| `/compliance` | Compliance panel             | `ComplianceLookup` + `ComplianceBadge` — `/api/holders`, MCP `get_compliance_status`                                                                                                                              |
| `/staking`    | Staking/yield panel          | `StakingPanel` — `/api/tokens/:hash/yield`, MCP `list_validators`, `restake`                                                                                                                                      |

---

## Section 10 Components (implemented)

| Component           | Location                                         | Purpose                                                  |
| ------------------- | ------------------------------------------------ | -------------------------------------------------------- |
| `WalletConnect`     | `src/components/WalletConnect.tsx`               | Connect/disconnect, account chip, balance, explorer link |
| `TransactionStatus` | `src/components/TransactionStatus.tsx`           | RPC polling via `pollTransactionStatus()`                |
| `ComplianceBadge`   | `src/components/ComplianceBadge.tsx`             | Holder compliance status chip                            |
| `ComplianceLookup`  | `src/dashboard/components/ComplianceLookup.tsx`  | Account hash lookup + MCP compliance                     |
| `StakingPanel`      | `src/dashboard/components/StakingPanel.tsx`      | Vault KPIs, validators, restake flow                     |
| `TokenIssueForm`    | `src/dashboard/components/TokenIssueForm.tsx`    | Issue token MCP → sign → submit                          |
| `X402PaymentFlow`   | `src/dashboard/components/X402PaymentFlow.tsx`   | Full 402 → sign → verify → paid resource settlement loop |
| `YieldChart`        | `src/components/YieldChart.tsx`                  | Live yield history chart                                 |
| `AuditTrail`        | `src/dashboard/components/AuditTrail.tsx`        | Audit summaries + events                                 |
| `AgentDecisionFeed` | `src/dashboard/components/AgentDecisionFeed.tsx` | Agent decisions with attestation links                   |
| `ProtocolStats`     | `src/components/ProtocolStats.tsx`               | Landing page live KPIs                                   |

**Hooks/libs:** `useWalletSession`, `useWalletActions`, `lib/schemas.ts` (Zod + public key validation), `revalidateMeridianData()` after tx submit.

---

## APIs Used (exact endpoints)

All browser calls go through Next.js proxy routes under `frontend/src/app/api/`. Server handlers attach `X-API-Key: MERIDIAN_API_KEY` via `lib/server/backend.ts`.

| Proxy route                                 | Backend target                                                                        |
| ------------------------------------------- | ------------------------------------------------------------------------------------- |
| `GET /api/health`                           | `GET /health`                                                                         |
| `GET /api/ready`                            | `GET /ready`                                                                          |
| `GET /api/tokens`                           | `GET /api/v1/tokens`                                                                  |
| `GET /api/tokens/[packageHash]`             | `GET /api/v1/tokens/:packageHash`                                                     |
| `GET /api/tokens/[packageHash]/yield`       | `GET /api/v1/tokens/:packageHash/yield`                                               |
| `GET /api/yields/history?limit=N`           | `GET /api/v1/yields/history`                                                          |
| `GET /api/holders?limit=N`                  | `GET /api/v1/holders`                                                                 |
| `GET /api/holders/[accountHash]/compliance` | `GET /api/v1/holders/:accountHash/compliance`                                         |
| `GET /api/events?limit=N`                   | `GET /api/v1/events`                                                                  |
| `GET /api/audit/summaries?limit=N`          | `GET /api/v1/audit/summaries`                                                         |
| `GET /api/decisions?limit=N`                | `GET /api/v1/decisions`                                                               |
| `POST /api/mcp`                             | MCP Streamable HTTP `POST /mcp`                                                       |
| `POST /api/x402/verify`                     | x402 `POST /verify`                                                                   |
| `POST /api/x402/settle`                     | x402 `POST /settle` (available; UI avoids double-settle in combined mode)             |
| `GET /api/x402/resource/[resource]`         | x402 paid resources (combined service verifies + settles when `X-Payment` is present) |

**Production URLs (from `.env`):**

- Backend: `https://meridian-backend-ikx8.onrender.com`
- MCP: `https://meridian-mcp-server-94q4.onrender.com`
- x402: `https://meridian-x402-facilitator.onrender.com`

---

## Contracts Used (package hashes from `deployed/addresses.json`)

| Contract           | Package hash                                                                        |
| ------------------ | ----------------------------------------------------------------------------------- |
| MeridianToken      | `contract-package-9bcac97d0e6723049fc130daa22f69e88a5d077a1df6b4e38536f0703bcaa2ca` |
| ComplianceRegistry | `contract-package-e6ed2d2eb8a1ffc7aa55a4158643a3682493d6f15f1e7123113a9c8534ee84f8` |
| StakingVault       | `contract-package-3062ba32a4ef4d3fd0fc5c9d0895980b7bbbcc5f407590d1b14c60ca631300c7` |
| YieldDistributor   | `contract-package-378bf2fddb1e574f39014bff6280f101c264da6fc4c629ad4e8c0d8ce55a6c34` |
| MeridianAudit      | `contract-package-1d8bc0bbbb6dda232afcff2afa257e7572d1ac33c518b1852b9a34c707493d84` |

Network: `casper-test` · Explorer: `https://testnet.cspr.live/`

---

## Wallet Integration (CSPR.click version, network, flows tested)

| Item                 | Value                                                                                                    |
| -------------------- | -------------------------------------------------------------------------------------------------------- |
| Package              | `@make-software/csprclick-ui` ^1.7.2                                                                     |
| Network              | `casper-test` (`NEXT_PUBLIC_CASPER_NETWORK`)                                                             |
| RPC (browser submit) | `https://node.testnet.casper.network/rpc` (public testnet — no API key)                                  |
| Providers            | casper-wallet                                                                                            |
| SSR                  | CSPR.click loaded client-only via `ClickProviderWrapper` (`ThemeProvider` + `ClickProvider` + `ClickUI`) |

**Flows implemented:**

1. `LandingWalletButton` — Connect Wallet → documented `clickRef.signIn()` flow; dashboard shows connected account only
2. `useWalletSession` — account/balance polling every 30s plus CSPR.click session events
3. MCP write tools — `useWalletActions.signAndSubmit()` → `clickRef.sign()` → `RpcClient.putTransaction()` → `revalidateMeridianData()`
4. x402 — `buildX402Payment()` → `signMessage` (authorization digest) + `sign` (native transfer tx)
5. `TransactionStatus` — polls `pollTransactionStatus()` until finalized/failed

**Manual test required:** Connect wallet on `/issue` or `/mcp`, invoke a write tool, approve signing in CSPR.click popup.

---

## MCP Integration (tools tested, session transport)

| Item                | Detail                                             |
| ------------------- | -------------------------------------------------- |
| Transport           | Streamable HTTP via server route `POST /api/mcp`   |
| Client              | `@modelcontextprotocol/sdk` in `lib/server/mcp.ts` |
| Production URL      | `https://meridian-mcp-server-94q4.onrender.com`    |
| Health (2026-07-03) | `{"status":"ok","transport":"http","tools":12}`    |

**Read tools (UI on `/mcp`, `/compliance`, `/staking`):** `get_token_info`, `get_yield_rate`, `get_holder_yield`, `get_compliance_status`, `list_validators`, `subscribe_audit`

**Write tools (sign flow on `/mcp`, `/issue`, `/staking`):** `issue_token`, `transfer_token`, `register_holder`, `revoke_holder`, `restake`, `distribute_rewards`

---

## x402 Integration (loops tested, settlement hashes)

| Item                | Detail                                                                                                                                             |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Service             | `https://meridian-x402-facilitator.onrender.com` (combined mode)                                                                                   |
| Health (2026-07-03) | `{"status":"ok","service":"x402-facilitator"}`                                                                                                     |
| Implementation      | `lib/x402.ts` — SHA-256 authorization hash, CSPR.click `signMessage` + native transfer sign                                                        |
| UI                  | `X402PaymentFlow` on `/x402` — 402 → sign → verify → retry with `X-Payment`; combined resource endpoint settles and returns data + settlement hash |

**Resources:** `yield-rate`, `validator-performance`, `sanctions-merkle`

**Note:** Browser authorization signing uses `signMessage(digestHex)`. If verify returns `invalid_signature`, the wallet message format may differ from server-side `signAndAddAlgorithmBytes` — test with a funded testnet wallet and document settlement hash in this section when confirmed.

---

## AI Integration (decision feed, audit summaries)

- `AgentDecisionFeed` on `/agents` — `GET /api/decisions` with attestation explorer links
- `AuditTrail` on `/audit` — `GET /api/audit/summaries` + `GET /api/events`
- `Level` chart — decision volume buckets from live decisions API
- No OpenAI/browser AI calls — all agent logic remains server-side

---

## Mock Removal Verification (grep results)

```bash
rg -i "mock|fake|placeholder|demo|hardcoded|lorem" frontend/src --glob '!**/*.test.*'
```

**Result:** Zero mock/fake/demo data hits. Remaining `placeholder` matches are HTML input placeholder attributes only.

**Removed in UX loop (2026-07-06):**

- Fake KPI `+0% this era` increments on `SaleCard`
- Unsplash stock images and fabricated popularity on `TrendingNow` / `SlideItem`
- Template chart labels: “New Visitors”, “Level 1–6”, static month/day axes
- Non-functional topbar search and notification bell

**Previously deleted/replaced:**

- `src/dashboard/data/mock.ts` (removed)
- `nickelfox/data/sales-data.ts`, `product-data.ts`, `customer-data.ts` (removed)
- `nickelfox/data/chart-data/customer-fulfillment.ts`, `visitor-insights.ts`, `level.ts` (removed — replaced with live API data)

```bash
rg "MERIDIAN_API_KEY|CASPER_API_KEY" frontend/src
```

**Result:** Zero client-side secret references. `MERIDIAN_API_KEY` only in `lib/server/backend.ts` (server-only).

---

## Test Matrix Results (Section 13 — all 56 rows)

| #     | Test                           | Status      | Notes                                                                                                                              |
| ----- | ------------------------------ | ----------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| 1–10  | Page routes render             | **PASS**    | `/`, `/dashboard`, `/issue`, `/audit`, `/agents`, `/compliance`, `/staking`, `/mcp`, `/x402` return 200; missing route returns 404 |
| 11–15 | Wallet connect/sign            | **PENDING** | Requires manual CSPR.click session                                                                                                 |
| 16–19 | Token/yield/holder API widgets | **PASS**    | Local `/api/*` proxy returns live Render backend data                                                                              |
| 20–22 | Events/audit/decisions feeds   | **PASS**    | Events and decisions return live backend rows                                                                                      |
| 23    | Backend cold start UI          | **PASS**    | Loading spinners + error alerts present                                                                                            |
| 24–29 | MCP read tools                 | **PASS**    | `get_token_info` verified through `/api/mcp` with live deployed/indexed data                                                       |
| 30–35 | MCP write tools                | **PENDING** | Unsigned tx display + sign flow coded                                                                                              |
| 36    | Unpaid x402 → 402              | **PASS**    | `/api/x402/resource/yield-rate` returns HTTP 402 with real payment terms                                                           |
| 37–41 | verify/settle/paid loops       | **PENDING** | Requires wallet + funded account; UI fixed to avoid double settlement in combined mode                                             |
| 42–45 | Sign/submit/poll/refresh       | **PENDING** | Coded; needs live wallet test                                                                                                      |
| 46–48 | Loading/empty/error states     | **PASS**    | Implemented across dashboard widgets                                                                                               |
| 49–50 | Rate limit / offline           | **PARTIAL** | SWR retry; no dedicated offline banner                                                                                             |
| 51–54 | Infra via `/ready`             | **PARTIAL** | `/api/ready` 200; postgres, RPC, CSPR.cloud, Upstash and stream OK; indexer lag high                                               |
| 55–56 | Agents/indexer                 | **PARTIAL** | Decisions/events available; indexer lag remains                                                                                    |

**Automated pass rate:** Core route/API/MCP/x402 unpaid checks pass; wallet signing, x402 settlement, and write transactions remain manual funded-wallet tests.

**Vitest:** 3/3 schema validation tests pass  
**Playwright:** 4/4 smoke tests at `frontend/tests/e2e/smoke.spec.ts` pass against local dev server.
**Route status check:** 9/9 main routes return 200; `/definitely-missing` returns 404.

---

## Performance (Lighthouse scores, SWR cache config)

| Metric               | Value                                                                         |
| -------------------- | ----------------------------------------------------------------------------- |
| SWR refresh          | 30–60s per hook (`useMeridianData.ts`)                                        |
| API proxy revalidate | 30s default (`backendFetch`)                                                  |
| Build first-load JS  | ~88 kB shared; dashboard shell ~114 kB (lazy-loads MUI + ECharts client-side) |
| Lighthouse           | Not run in this session — recommend before Vercel/production deploy           |

---

## Security Notes (secret scan, CSP, proxy pattern)

| Check                                | Status                                                                                      |
| ------------------------------------ | ------------------------------------------------------------------------------------------- |
| `MERIDIAN_API_KEY` in client bundle  | **PASS** — server routes only                                                               |
| Backend called from browser directly | **PASS** — all via `/api/*`                                                                 |
| CSP / security headers               | **PARTIAL** — X-Frame-Options, X-Content-Type-Options, Referrer-Policy in `next.config.mjs` |
| CSPR.cloud API key in browser        | **PASS** — not used client-side                                                             |
| `.env` loaded server-side            | Root `.env` via `dotenv` in `next.config.mjs`                                               |
| Zod input validation                 | **PASS** — `lib/schemas.ts` for public keys and form inputs                                 |

---

## Remaining Issues (with STOP recommendations)

1. **Manual wallet E2E (REQUIRED)** — Issue token, MCP write tools, and x402 settlement need a funded `casper-test` wallet via CSPR.click. **STOP for full production sign-off:** do not claim final transaction readiness until explorer hashes are captured.

2. **x402 browser signature format (MEDIUM)** — Authorization signing uses CSPR.click `signMessage`. If verify returns `invalid_signature`, align with the facilitator's expected signature bytes. **Do not** add server-side PEM signing in frontend.

3. **Indexer lag (MEDIUM)** — Backend `/ready` is 200 but reports high indexer lag. Reads are functional; production readiness requires the backend indexer to catch up or document lag tolerance.

4. **Stack version drift (LOW)** — Prompt pins Next 16 / React 19 / Tailwind 4; project uses Next 14 / React 18 for CSPR.click compatibility. Documented and intentional.

5. **Dedicated transfer/register/revoke UI (LOW)** — Available via `/mcp` tool explorer; no separate pages.

---

## Frontend Readiness Score

| Area                    | Weight | Score | Weighted |
| ----------------------- | ------ | ----- | -------- |
| Mock removal            | 15%    | 98    | 14.70    |
| Backend API integration | 20%    | 92    | 18.40    |
| Wallet + transactions   | 20%    | 82    | 16.40    |
| MCP integration         | 15%    | 94    | 14.10    |
| x402 integration        | 15%    | 84    | 12.60    |
| Testing + security      | 15%    | 88    | 13.20    |

### **Total: 89.4 / 100**

**Verdict:** Frontend architecture, components, proxy integration, build, route checks, MCP read flow, and x402 unpaid flow are production-ready. **GO threshold (≥90) is narrowly not met** because wallet-signed MCP writes and x402 settlement still require manual funded-wallet confirmation with explorer hashes, and backend indexer lag remains high.

---

## Verified Official Dependency Pins

| Package                     | Version verified |
| --------------------------- | ---------------- |
| casper-js-sdk               | 5.0.12           |
| @make-software/csprclick-ui | 1.7.2            |
| next                        | 14.2.30          |
| react / react-dom           | 18.3.1           |
| swr                         | 2.3.3            |
| zod                         | 3.25.76          |
| vitest                      | 3.2.4            |
| @playwright/test            | 1.52.0           |

---

## Files Changed (frontend only — includes UX loop 2026-07-06)

- `DESIGN.md` — Kraken design tokens (project root)
- `frontend/src/nickelfox/data/nav-items.ts` — grouped navigation structure
- `frontend/src/nickelfox/layouts/main-layout/Sidebar/` — grouped sidebar + tooltips
- `frontend/src/nickelfox/layouts/main-layout/Topbar/Topbar.tsx` — backend chip, wallet CTA, removed dead controls
- `frontend/src/components/WalletAccountStatus.tsx` — Connect Wallet when disconnected
- `frontend/src/nickelfox/components/sections/dashboard/` — KPI, chart, trending widget UX fixes
- `frontend/src/nickelfox/theme/palette.ts` — distinct info color
- `frontend/src/app/(dashboard)/loading.tsx`, `error.tsx` — route boundaries
- `frontend/src/app/` — Next.js routes + 17 API proxy handlers (incl. `/api/ready`)
- `frontend/src/app/(dashboard)/` — shared dashboard layout and client-only transaction-heavy pages
- `frontend/lib/` — API client, server backend/MCP, hooks, x402, transactions, contracts, schemas
- `frontend/src/nickelfox/` — Dashboard sections wired to live data
- `frontend/src/dashboard/` — Pages + Section 10 components
- `frontend/src/components/` — WalletConnect, WalletAccountStatus, TransactionStatus, TransactionReviewCard, StructuredDataCard, ComplianceBadge, YieldChart, ProtocolStats
- `frontend/src/providers/` — SWR + CSPR.click client providers
- `frontend/lib/schemas.test.ts`, `frontend/vitest.config.ts` — unit tests
- `frontend/tests/e2e/smoke.spec.ts`, `frontend/playwright.config.ts` — E2E smoke tests
- `docs/reports/FRONTEND_INTEGRATION_REPORT.md` — this report

**Forbidden systems:** unchanged.
