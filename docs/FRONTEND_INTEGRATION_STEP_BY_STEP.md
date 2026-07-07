# MERIDIAN Frontend Integration Step-by-Step

**Date:** 2026-07-05 (updated 2026-07-06)  
**Scope:** Frontend-only integration work for the MERIDIAN dApp.  
**Frontend:** `frontend/`  
**Backend target:** Render backend through Next.js API proxy  
**Do not touch:** backend, contracts, agents, MCP server, x402 service, database, Render config, Supabase schema, Upstash config.

---

## 1. Goal

The goal was to turn the existing frontend/template into a working MERIDIAN dApp connected to real services:

- Render backend API
- Casper testnet data
- Live deployed contract package hashes
- CSPR.click wallet session
- MCP read/write tools
- x402 paid resource flow
- AI agent decisions
- Supabase-indexed events exposed by backend

The frontend must not fake blockchain state, expose backend secrets, bypass wallet signing, or modify backend systems.

---

## 2. High-Level Architecture

Browser code calls only local Next.js routes:

```text
Browser UI
  -> /api/* Next.js route handlers
  -> Render backend / MCP / x402
  -> Supabase / Casper RPC / contracts / agents
```

Wallet and transaction flow:

```text
User clicks action
  -> frontend calls MCP write tool
  -> MCP returns unsigned TransactionV1 JSON
  -> CSPR.click asks Casper Wallet to sign
  -> frontend submits signed transaction via casper-js-sdk
  -> frontend polls transaction status
  -> SWR refreshes live backend data
```

x402 flow:

```text
Request paid resource
  -> receives HTTP 402 payment terms
  -> wallet signs x402 authorization + transfer transaction
  -> frontend verifies payment proof
  -> frontend retries resource with X-Payment
  -> combined x402 resource endpoint settles and returns data
```

---

## 3. Environment Wiring

The frontend reads the root `.env` through `frontend/next.config.mjs`.

Required frontend integration values:

```env
BACKEND_URL=https://meridian-backend-ikx8.onrender.com
BACKEND_URL_PRODUCTION=https://meridian-backend-ikx8.onrender.com
MERIDIAN_API_KEY=<same key as Render backend>

NEXT_PUBLIC_CASPER_NETWORK=casper-test
NEXT_PUBLIC_MERIDIAN_CONTRACT_PACKAGE_HASH=contract-package-9bcac97d0e6723049fc130daa22f69e88a5d077a1df6b4e38536f0703bcaa2ca
NEXT_PUBLIC_MCP_SERVER_URL=https://meridian-mcp-server-94q4.onrender.com
NEXT_PUBLIC_X402_FACILITATOR_URL=https://meridian-x402-facilitator.onrender.com
```

Important rules:

- `MERIDIAN_API_KEY` remains server-only.
- Browser code does not call Render backend `/api/v1/*` directly.
- Browser code calls frontend `/api/*` routes.
- Casper/CSPR.cloud API keys are never exposed to the browser.

---

## 4. Backend Proxy Integration

### 4.1 Server-side backend helper

File:

```text
frontend/lib/server/backend.ts
```

What it does:

1. Resolves backend URL from `BACKEND_URL`.
2. Falls back to `BACKEND_URL_PRODUCTION`.
3. Prevents production builds from using localhost backend.
4. Adds `X-API-Key` server-side.
5. Parses backend JSON responses and errors.

This lets browser code safely call local routes such as:

```text
/api/tokens
/api/events
/api/decisions
/api/ready
```

instead of calling:

```text
https://meridian-backend-ikx8.onrender.com/api/v1/*
```

### 4.2 Client API wrapper

File:

```text
frontend/lib/api.ts
```

What changed:

1. Added a typed client for frontend `/api/*` routes.
2. Added better error extraction for:
   - `{ error: { message } }`
   - `{ error: "..." }`
   - `{ reason: "..." }`
   - `{ detail: "..." }`
3. Kept all frontend calls local to the Next.js app.

Main methods:

```text
meridianApi.health()
meridianApi.ready()
meridianApi.tokens()
meridianApi.token(packageHash)
meridianApi.tokenYield(packageHash)
meridianApi.yieldHistory(limit)
meridianApi.holders(limit)
meridianApi.holderCompliance(accountHash)
meridianApi.events(limit)
meridianApi.auditSummaries(limit)
meridianApi.decisions(limit)
meridianApi.mcpTool(tool, args)
meridianApi.x402Verify(payment, network)
meridianApi.x402Settle(payment, network)
```

---

## 5. Next.js API Routes

Frontend route handlers under:

```text
frontend/src/app/api/
```

Proxy routes implemented:

```text
GET  /api/health
GET  /api/ready
GET  /api/tokens
GET  /api/tokens/[packageHash]
GET  /api/tokens/[packageHash]/yield
GET  /api/yields/history
GET  /api/holders
GET  /api/holders/[accountHash]/compliance
GET  /api/events
GET  /api/audit/summaries
GET  /api/decisions
POST /api/mcp
POST /api/x402/verify
POST /api/x402/settle
GET  /api/x402/resource/[resource]
```

Backend target paths are fixed and match `docs/FRONTEND_EXECUTION_MASTER_PROMPT.md`.

---

## 6. Template Integration

The Nickelfox dashboard template was kept as the visual shell and connected to MERIDIAN data.

Key frontend areas:

```text
frontend/src/nickelfox/
frontend/src/dashboard/
frontend/src/components/
frontend/lib/
```

Important dashboard/template changes:

1. Removed the profile photo dropdown from the dashboard top bar.
2. Kept wallet/account display in the top bar only when connected.
3. Reworked dashboard routing into a shared route group layout.
4. Removed static dashboard metrics and replaced them with live SWR hooks.
5. Improved route navigation performance by keeping the dashboard shell mounted.

Dashboard route group:

```text
frontend/src/app/(dashboard)/
```

Routes:

```text
/dashboard
/issue
/audit
/agents
/mcp
/x402
/compliance
/staking
```

---

## 7. CSPR.click Wallet Integration

Official CSPR.click docs used:

```text
https://docs.cspr.click/documentation/overview
https://docs.cspr.click/cspr.click-sdk/integration
https://docs.cspr.click/cspr.click-sdk/integration/connecting-a-wallet
https://docs.cspr.click/cspr.click-sdk/integration/signing-transactions
https://docs.cspr.click/cspr.click-sdk/integration/react-context-provider
```

### 7.1 Wallet configuration

File:

```text
frontend/lib/csprclick.ts
```

Current config:

```text
appName: MERIDIAN
appId: NEXT_PUBLIC_CSPRCLICK_APP_ID or csprclick-template
contentMode: IFRAME
providers: [WALLET_KEYS.CASPER_WALLET]
chainName: casper-test
casperNode: https://node.testnet.casper.network/rpc
```

Notes:

- `csprclick-template` is used for localhost development as documented by CSPR.click.
- Production should use a registered `NEXT_PUBLIC_CSPRCLICK_APP_ID`.
- Only Casper Wallet is enabled for the current UX.

### 7.2 Provider setup

Files:

```text
frontend/src/providers/ClientProviders.tsx
frontend/src/providers/ClickProviderWrapper.tsx
frontend/lib/csprclickTheme.ts
frontend/src/types/styled-components.d.ts
```

What was required:

1. Load CSPR.click client-only because the package touches `window`.
2. Wrap the app with `ThemeProvider`.
3. Use CSPR.click theme from `DefaultThemes` / `buildTheme`.
4. Add `ClickProvider`.
5. Add `ClickUI`.
6. Set `rootAppElement="body"` and `body id="root"` to avoid react-modal errors.
7. Add a minimal `styled-components` declaration because package types were missing locally.

Final provider hierarchy:

```text
SWRProvider
  -> dynamic no-SSR ClickProviderWrapper
     -> styled-components ThemeProvider
        -> CSPR.click ClickProvider
           -> ClickUI
           -> application children
```

### 7.3 Connect button behavior

Files:

```text
frontend/src/components/LandingWalletButton.tsx
frontend/lib/wallet/connectCasperWallet.ts
frontend/lib/hooks/useClickReady.ts
frontend/lib/hooks/useWalletSession.ts
```

Flow:

```text
Connect Wallet button
  -> connectCasperWallet(clickRef)
  -> clickRef.signIn()
  -> CSPR.click/Casper Wallet connection UI
  -> csprclick:signed_in event
  -> useWalletSession stores account
  -> navbar displays shortened public key and balance
```

Important fix:

- Earlier code forced `connect('casper-wallet')`.
- CSPR.click docs say custom buttons should call `signIn()` and update UI from events.
- The code now follows that documented flow.

Session events listened to:

```text
csprclick:signed_in
csprclick:switched_account
csprclick:unsolicited_account_change
csprclick:signed_out
csprclick:disconnected
```

### 7.4 Dashboard wallet state

File:

```text
frontend/src/components/WalletAccountStatus.tsx
```

Behavior:

1. Dashboard no longer shows a Connect Wallet button.
2. If connected, dashboard top bar shows:
   - shortened public key
   - balance
   - Disconnect button
3. If not connected, dashboard top bar stays clean.

---

## 8. Real Data Integration

### 8.1 SWR hooks

File:

```text
frontend/lib/hooks/useMeridianData.ts
```

Live hooks:

```text
useHealth()
useReady()
useTokens()
useTokenYield()
useYieldHistory()
useHolders()
useHolderCompliance()
useEvents()
useAuditSummaries()
useDecisions()
useProtocolKpis()
```

Refresh intervals:

```text
30s for fast-changing app data
60s for health/history/audit summaries
```

### 8.2 Landing page

Files:

```text
frontend/src/views/LandingPage.tsx
frontend/src/components/Navbar.tsx
frontend/src/components/Hero.tsx
frontend/src/components/ProtocolStats.tsx
```

Changes:

1. Added wallet connection to landing navbar.
2. Kept `Open Dashboard` button visible.
3. Connected protocol stats to live backend data.
4. Moved landing page from `src/pages` to `src/views` to avoid Next.js page-data collection issues.

### 8.3 Dashboard pages

Routes and data:

```text
/dashboard  -> tokens, yield, holders, decisions, compliance
/audit      -> audit summaries, events, decisions, yield history
/agents     -> decisions
/compliance -> holders, compliance lookup, MCP compliance
/staking    -> token yield, MCP validators, restake
/mcp        -> MCP read/write tool explorer
/x402       -> paid resources
/issue      -> MCP issue_token transaction flow
```

---

## 9. MCP Integration

### 9.1 MCP server client

File:

```text
frontend/lib/server/mcp.ts
```

What it does:

1. Creates MCP `Client`.
2. Uses `StreamableHTTPClientTransport`.
3. Connects to:

```text
NEXT_PUBLIC_MCP_SERVER_URL
or MERIDIAN_MCP_URL
or https://meridian-mcp-server-94q4.onrender.com
```

4. Calls tools server-side through `/api/mcp`.

### 9.2 MCP route

File:

```text
frontend/src/app/api/mcp/route.ts
```

Request shape:

```json
{
  "tool": "get_token_info",
  "arguments": {}
}
```

Response shape:

```json
{
  "result": {}
}
```

### 9.3 MCP UI

File:

```text
frontend/src/dashboard/pages/McpPage.tsx
```

Changes:

1. Read and write tools are grouped separately.
2. Read tool output no longer displays as raw JSON.
3. `StructuredDataCard` renders returned objects as labeled fields.
4. Write tools detect unsigned transactions.
5. Unsigned transactions display in `TransactionReviewCard`.
6. User signs and submits through wallet.

Advanced note:

- The MCP arguments input remains JSON because MCP tools require structured arguments.
- Outputs are user-friendly cards.

---

## 10. Transaction UI

### 10.1 Transaction review

File:

```text
frontend/src/components/TransactionReviewCard.tsx
```

Purpose:

Replace raw unsigned transaction JSON with a modern review card.

Shows:

- Transaction type
- Network
- Chain name
- Payload size
- MCP note
- Wallet signature requirement
- Sign & Submit button
- Private-key safety message

Used in:

```text
/issue
/mcp
/staking
```

### 10.2 Transaction status

File:

```text
frontend/src/components/TransactionStatus.tsx
```

Purpose:

Show submitted transaction status in a modern card.

Shows:

- Pending / processed / finalized / failed chip
- Spinner while polling
- Short transaction hash
- Explorer link
- Error/finality detail

Polling helper:

```text
frontend/lib/transactions.ts
```

Submit helper:

```text
RpcClient.putTransaction(signedTransaction)
```

RPC:

```text
https://node.testnet.casper.network/rpc
```

---

## 11. x402 Integration

### 11.1 Initial implementation

Files:

```text
frontend/lib/x402.ts
frontend/src/dashboard/components/X402PaymentFlow.tsx
frontend/src/app/api/x402/resource/[resource]/route.ts
frontend/src/app/api/x402/verify/route.ts
frontend/src/app/api/x402/settle/route.ts
```

Flow before fix:

```text
request resource
  -> 402
  -> sign payment
  -> verify
  -> settle
  -> retry resource with X-Payment
```

Problem found:

The x402 service is running in combined mode. The paid resource endpoint already verifies and settles internally when it receives `X-Payment`.

Calling `/settle` before retrying the resource can consume the nonce. Then the paid resource retry can fail because the nonce has already been used.

### 11.2 Corrected x402 flow

Current frontend flow:

```text
1. Request unpaid resource
2. Receive HTTP 402 payment terms
3. Wallet signs authorization and native transfer transaction
4. Frontend calls /verify
5. Frontend retries resource with X-Payment
6. Resource endpoint verifies + settles internally
7. Resource endpoint returns data + settlement hash
8. UI displays unlocked data and transaction status
```

### 11.3 x402 UI changes

The x402 page now shows:

- selected resource
- payment amount in CSPR
- scheme/network/asset chips
- pay-to account hash
- step progress:
  - signing
  - verifying
  - settling
  - accessing
  - complete
  - failed
- detailed error reason from backend
- unlocked paid data using `StructuredDataCard`
- settlement transaction hash and status

---

## 12. Structured Data UI

### 12.1 Structured data card

File:

```text
frontend/src/components/StructuredDataCard.tsx
```

Purpose:

Replace raw JSON output with readable cards.

Features:

- labels object fields
- renders arrays as entries
- truncates long hashes
- auto-links transaction hashes
- auto-links contract/package hashes
- handles empty data
- handles booleans as chips

Used in:

```text
/mcp
/x402
```

---

## 13. Audit and Agent UI Improvements

### 13.1 Audit trail

File:

```text
frontend/src/dashboard/components/AuditTrail.tsx
```

Before:

- events were shown as plain rows
- long transaction hashes dominated the UI
- empty summaries looked like missing content

After:

- summary and event counters
- summary cards
- event chips for contract/event/source
- block height and indexed time
- shortened explorer links
- clear empty states

### 13.2 Agent decision feed

File:

```text
frontend/src/dashboard/components/AgentDecisionFeed.tsx
```

Before:

- displayed `JSON.stringify(row.payload)`
- hard to read rationale/action/summary

After:

- agent name chip
- approval status chip
- decision title
- readable rationale/summary
- confidence chip when available
- reviewed-by chip when available
- attestation account link when available
- decision hash truncation

---

## 14. Issue Token Flow

File:

```text
frontend/src/dashboard/components/TokenIssueForm.tsx
```

Flow:

```text
1. User enters token symbol and initial supply
2. Frontend reads connected wallet public key
3. Frontend calls MCP tool issue_token through /api/mcp
4. MCP returns unsigned TransactionV1
5. TransactionReviewCard displays transaction summary
6. User clicks Sign & Submit with Wallet
7. CSPR.click asks Casper Wallet to sign
8. Frontend submits signed transaction via casper-js-sdk
9. TransactionStatus polls Casper testnet
10. SWR revalidates frontend data
```

No raw unsigned transaction JSON is shown to the user.

---

## 15. Staking / Restake Flow

File:

```text
frontend/src/dashboard/components/StakingPanel.tsx
```

Flow:

```text
1. Frontend loads token yield from backend
2. Frontend loads validators via MCP list_validators
3. User selects source and destination validator
4. User enters amount in motes
5. Frontend calls MCP restake
6. MCP returns unsigned TransactionV1
7. TransactionReviewCard displays summary
8. Wallet signs and frontend submits transaction
9. TransactionStatus polls finality
10. SWR revalidates backend data
```

---

## 16. Contract Address Integration

Frontend uses the live MeridianToken package hash:

```text
contract-package-9bcac97d0e6723049fc130daa22f69e88a5d077a1df6b4e38536f0703bcaa2ca
```

Source:

```text
NEXT_PUBLIC_MERIDIAN_CONTRACT_PACKAGE_HASH
deployed/addresses.json
```

Contract display helpers:

```text
frontend/lib/contracts.ts
```

Explorer helpers:

```text
explorerTxUrl()
explorerAccountUrl()
explorerContractUrl()
truncateHash()
formatMotes()
formatApy()
```

---

## 17. Testing and Verification

### 17.1 Build

Command:

```powershell
cd E:\AKINDO\MERIDIAN\frontend
pnpm run build
```

Status:

```text
PASS
```

### 17.2 Unit tests

Command:

```powershell
cd E:\AKINDO\MERIDIAN\frontend
pnpm test
```

Status:

```text
PASS - 3/3 Vitest tests
```

### 17.3 Playwright smoke tests

Command:

```powershell
cd E:\AKINDO\MERIDIAN\frontend
$env:PLAYWRIGHT_BASE_URL="http://localhost:3000"
pnpm test:e2e
```

Status:

```text
PASS - 4/4 smoke tests
```

### 17.4 Backend proxy checks

Commands:

```powershell
curl.exe -s http://localhost:3000/api/health
curl.exe -s http://localhost:3000/api/ready
curl.exe -s http://localhost:3000/api/tokens
curl.exe -s "http://localhost:3000/api/events?limit=5"
curl.exe -s "http://localhost:3000/api/decisions?limit=5"
```

Status:

```text
PASS - live data returned
```

Known backend condition:

```text
Backend is reachable but health is degraded because CSPR.cloud is unreachable and indexer lag is high.
```

### 17.5 MCP proxy check

PowerShell:

```powershell
$body = @{ tool = 'get_token_info'; arguments = @{} } | ConvertTo-Json -Compress
Invoke-RestMethod -Uri 'http://localhost:3000/api/mcp' -Method Post -ContentType 'application/json' -Body $body
```

Status:

```text
PASS - live deployed/indexed token data returned
```

### 17.6 x402 unpaid check

Command:

```powershell
curl.exe -s -w "`nHTTP:%{http_code}`n" http://localhost:3000/api/x402/resource/yield-rate
```

Expected:

```text
HTTP:402
Payment terms JSON
```

Status:

```text
PASS
```

---

## 18. Manual Wallet Test Checklist

These cannot be fully automated without a real funded testnet wallet.

### 18.1 Wallet connect

1. Open `http://localhost:3000`.
2. Unlock Casper Wallet.
3. Confirm wallet network is Casper Testnet.
4. Click `Connect Wallet`.
5. Approve connection.
6. Confirm navbar changes from `Connect Wallet` to shortened public key.
7. Open dashboard.
8. Confirm account remains connected.
9. Click disconnect and confirm state clears.

### 18.2 MCP write transaction

1. Open `/mcp`.
2. Select a write tool.
3. Enter valid JSON arguments.
4. Click `Invoke`.
5. Confirm `TransactionReviewCard` appears.
6. Click `Sign & Submit with Wallet`.
7. Approve in Casper Wallet.
8. Confirm `TransactionStatus` appears.
9. Open explorer link.

### 18.3 Issue token

1. Open `/issue`.
2. Enter symbol and initial supply.
3. Click `Build via MCP`.
4. Review transaction card.
5. Sign and submit.
6. Confirm transaction hash on explorer.

### 18.4 x402 paid flow

1. Open `/x402`.
2. Select resource.
3. Click `Request (expect 402)`.
4. Confirm payment terms card appears.
5. Click `Pay · Verify · Settle · Access`.
6. Approve wallet signatures.
7. Watch step status:
   - signing
   - verifying
   - settling
   - accessing
   - complete
8. Confirm settlement hash.
9. Confirm unlocked data card appears.

---

## 19. Files Added, Status, and Next Steps

Sections **31–35** at the end of this document contain the updated file lists, current status, unchanged-systems list, and recommended next steps after the landing-page, dashboard, ECharts, SSR, x402, and manual-test work in Sections 24–30.

---

## 24. Landing Page Content and UX Refresh

After the core integration work, the landing page was rewritten so it reflects the real MERIDIAN stack instead of generic template marketing copy.

### 24.1 Hero simplification

File:

```text
frontend/src/components/Hero.tsx
```

Changes:

- Removed the interactive AI prompt input that made the hero feel crowded.
- Kept a focused headline: `MERIDIAN` + `compliant yield`.
- Short supporting copy about live contracts, backend data, wallet signing, MCP, and x402.
- Two primary CTAs: `Open live dashboard` and `View testnet evidence`.
- Small evidence badges: `5 deployed contracts` and `Real backend data`.
- `ProtocolStats` remains embedded below the hero for live KPIs.

### 24.2 Section content updates

| File                                       | Before                | After                                                                          |
| ------------------------------------------ | --------------------- | ------------------------------------------------------------------------------ |
| `frontend/src/components/Features.tsx`     | Generic SaaS features | Production stack: live contracts, compliance, AI decisions, MCP/x402           |
| `frontend/src/components/UseCases.tsx`     | Generic use cases     | `How MERIDIAN Works` — six numbered live workflow steps                        |
| `frontend/src/components/Pricing.tsx`      | Pricing tiers         | `Testnet Evidence & Readiness` — operational status and next steps             |
| `frontend/src/components/Testimonials.tsx` | Fake testimonials     | `Verified Integration Signals` — technical evidence cards                      |
| `frontend/src/components/FAQ.tsx`          | Generic FAQ           | MERIDIAN-specific questions about data sources, transactions, and verification |
| `frontend/src/components/CtaBanner.tsx`    | Generic CTA           | Encourages testing the live dApp and reviewing workflows                       |
| `frontend/src/components/Footer.tsx`       | Placeholder links     | Updated product/resource links to dashboard routes and landing sections        |

### 24.3 Workflow card styling

File:

```text
frontend/src/components/UseCases.tsx
```

Visual changes:

- Red radial/linear gradient card backgrounds.
- Step chips (`01`–`06`) with red accent borders.
- Hover invert effect: cards lift slightly, background darkens to black, red glow intensifies.
- `Live flow` footer label on each card.

Theme preserved: black background, red accent, existing landing typography.

### 24.4 Landing page route split

Files:

```text
frontend/src/views/LandingPage.tsx
frontend/src/app/page.tsx
```

Reason:

- Moved landing composition into `src/views/LandingPage.tsx`.
- Root `page.tsx` imports the view and sets `dynamic = 'force-dynamic'`.
- Avoids Next.js page-data collection issues with client-heavy landing sections.

---

## 25. Dashboard Theme and Navigation Performance

### 25.1 Dashboard hero header

File:

```text
frontend/src/nickelfox/pages/dashboard/Dashboard.tsx
```

Added `DashboardHero` at the top of the dashboard with:

- `MERIDIAN Control Center` title
- Status chips for backend, Casper testnet, CSPR.click wallet, and indexer lag when present

### 25.2 Widget polish

Files:

```text
frontend/src/nickelfox/components/sections/dashboard/todays-sales/TodaysSales.tsx
frontend/src/nickelfox/components/sections/dashboard/top-products/TopProducts.tsx
```

Changes:

- Clearer section headers and subtitles.
- Live/retrying status chip on KPIs.
- MUI `Alert` components for empty/error states instead of plain text.

### 25.3 Nickelfox theme updates

Files:

```text
frontend/src/nickelfox/theme/components/Paper.tsx
frontend/src/nickelfox/theme/components/Appbar.tsx
frontend/src/nickelfox/theme/components/Drawer.tsx
frontend/src/nickelfox/theme/components/FilledInput.tsx
frontend/src/nickelfox/layouts/main-layout/index.tsx
frontend/src/nickelfox/layouts/main-layout/Sidebar/Sidebar.tsx
frontend/src/nickelfox/layouts/main-layout/Sidebar/NavItem.tsx
frontend/src/nickelfox/layouts/main-layout/Topbar/Topbar.tsx
```

Changes:

- Glass-style paper cards with gradient, border, and backdrop blur.
- Floating topbar and sidebar styling aligned with the red/black theme.
- Active sidebar items use red accent, hover translate, and shadow.
- Topbar height reduced; profile photo removed from dashboard header.
- Connected wallet shown via `WalletAccountStatus` instead of a duplicate connect button.

### 25.4 Faster dashboard navigation

Files:

```text
frontend/src/app/(dashboard)/layout.tsx
frontend/src/app/(dashboard)/DashboardShellLayout.tsx
frontend/src/app/(dashboard)/**/page.tsx
```

Changes:

- Dashboard layout uses `dynamic = 'force-dynamic'`.
- `DashboardShellLayout` dynamically imports the Nickelfox layout with `ssr: false` and a loading spinner.
- Transaction-heavy routes (`/issue`, `/mcp`, `/staking`, `/x402`, `/audit`, `/agents`, `/compliance`) dynamically import their page components with `ssr: false`.

Result:

- No SSR crashes from CSPR.click / wallet code.
- Faster perceived navigation because the shell stays client-mounted while route content swaps.

---

## 26. ECharts Renderer Fix

### 26.1 Problem

Dashboard charts crashed in the browser with:

```text
Uncaught (in promise) Error: Renderer 'undefined' is not imported. Please import it first.
```

Cause:

- Chart components imported `echarts/core` directly without registering `CanvasRenderer` and chart modules.

### 26.2 Fix

New file:

```text
frontend/src/nickelfox/components/base/echartsSetup.ts
```

Registers:

```text
BarChart, GaugeChart, LineChart
GridComponent, LegendComponent, TooltipComponent
CanvasRenderer
```

Updated chart imports in:

```text
frontend/src/nickelfox/components/sections/dashboard/level/LevelChart.tsx
frontend/src/nickelfox/components/sections/dashboard/visitor-insights/VisitorInsightsChart.tsx
frontend/src/nickelfox/components/sections/dashboard/earnings/EarningsChart.tsx
frontend/src/components/YieldChart.tsx
```

Status:

```text
PASS — dashboard charts render without renderer errors
```

---

## 27. SSR and Client-Only Route Boundaries

### 27.1 Problem

Direct requests to routes such as `/issue`, `/mcp`, `/staking`, and `/x402` returned HTTP 500 during dev/build because client-only wallet code executed during SSR (`window is not defined`).

### 27.2 Fix pattern

Example:

```tsx
'use client'

import dynamic from 'next/dynamic'

const IssuePage = dynamic(() => import('@/dashboard/pages/IssuePage'), { ssr: false })

export default function IssueRoute() {
  return <IssuePage />
}
```

Applied to dashboard transaction routes and the dashboard shell layout.

CSPR.click remains client-only through:

```text
frontend/src/providers/ClientProviders.tsx
frontend/src/providers/ClickProviderWrapper.tsx
```

Status:

```text
PASS — all dashboard routes return 200 in dev, build, and Playwright smoke tests
```

---

## 28. API Proxy 500 / Stale Dev Cache

### 28.1 Problem

Browser requests such as:

```text
/api/tokens
/api/holders
/api/tokens/:hash/yield
```

returned HTTP 500 with errors like:

```text
Cannot find module './xxx.js'
```

This appeared after running `pnpm build` while `pnpm dev` was still running, leaving a stale `.next` cache.

### 28.2 Fix / operational procedure

1. Stop the dev server on port 3000.
2. Optionally delete `frontend/.next` if module resolution errors persist.
3. Restart with `pnpm --filter @meridian/frontend dev`.
4. Do not run `build` and `dev` concurrently on the same port/cache.

Verification:

```powershell
curl.exe -s -w "`nHTTP:%{http_code}`n" http://localhost:3000/api/tokens
curl.exe -s -w "`nHTTP:%{http_code}`n" "http://localhost:3000/api/holders?limit=10"
```

Expected:

```text
HTTP:200
Live JSON from Render backend
```

---

## 29. x402 Flow Correction (No Double Settle)

### 29.1 Problem

The first x402 UI called `/api/x402/settle` directly after `/api/x402/verify`. The combined x402 resource endpoint also settles when `X-Payment` is present, which caused duplicate settlement attempts and errors such as nonce replay or invalid payment.

### 29.2 Corrected flow

File:

```text
frontend/src/dashboard/components/X402PaymentFlow.tsx
frontend/lib/api.ts
```

Updated sequence:

```text
1. GET /api/x402/resource/:resource           -> HTTP 402 payment terms
2. Wallet signs authorization + native transfer
3. POST /api/x402/verify                      -> payment proof accepted
4. GET /api/x402/resource/:resource           -> retry with X-Payment header
5. Combined service settles internally
6. Response returns settlement hash + unlocked data
```

UI improvements in the same pass:

- Step progress chips: signing → verifying → settling → accessing → complete
- Specific backend error extraction (`reason`, `detail`, nested `error.message`)
- Payment terms and unlocked data shown through structured cards, not raw JSON

Note:

- `/api/x402/settle` remains available in the proxy for direct use, but the UI avoids calling it in combined mode.

---

## 30. Comprehensive Manual Test Scenario

Section 18 covers the core wallet checklist. The full end-to-end manual scenario below covers every route and integration surface.

### 30.1 Prerequisites

| Item     | Requirement                                                        |
| -------- | ------------------------------------------------------------------ |
| Frontend | `http://localhost:3000` via `pnpm --filter @meridian/frontend dev` |
| Backend  | `BACKEND_URL=https://meridian-backend-ikx8.onrender.com`           |
| Wallet   | Casper Wallet on Casper Testnet, funded with testnet CSPR          |
| Browser  | Chrome or Brave                                                    |

### 30.2 Terminal smoke checks

```powershell
curl.exe -s -w "`nHTTP:%{http_code}`n" https://meridian-backend-ikx8.onrender.com/health
curl.exe -s -w "`nHTTP:%{http_code}`n" http://localhost:3000/api/health
curl.exe -s -w "`nHTTP:%{http_code}`n" http://localhost:3000/api/ready
curl.exe -s -w "`nHTTP:%{http_code}`n" http://localhost:3000/api/tokens
curl.exe -s -w "`nHTTP:%{http_code}`n" "http://localhost:3000/api/events?limit=5"
curl.exe -s -w "`nHTTP:%{http_code}`n" "http://localhost:3000/api/decisions?limit=5"
curl.exe -s -w "`nHTTP:%{http_code}`n" "http://localhost:3000/api/holders?limit=10"

$body = @{ tool = 'get_token_info'; arguments = @{} } | ConvertTo-Json -Compress
Invoke-RestMethod -Uri 'http://localhost:3000/api/mcp' -Method Post -ContentType 'application/json' -Body $body

curl.exe -s -w "`nHTTP:%{http_code}`n" http://localhost:3000/api/x402/resource/yield-rate
```

Expected:

- Health/read endpoints → HTTP 200
- x402 unpaid resource → HTTP 402
- MCP read tool → structured token data

### 30.3 Route-by-route browser checklist

| #   | Route         | What to verify                                                |
| --- | ------------- | ------------------------------------------------------------- |
| 1   | `/`           | Hero, live stats, wallet connect/disconnect, updated sections |
| 2   | `/dashboard`  | KPIs, charts, active tokens, wallet status in topbar          |
| 3   | `/audit`      | Audit summaries, events, yield chart                          |
| 4   | `/agents`     | Agent decision feed with readable cards                       |
| 5   | `/compliance` | Holder lookup and compliance badge                            |
| 6   | `/issue`      | MCP build → transaction review card → sign/submit → explorer  |
| 7   | `/mcp`        | Read tools via structured cards; write tools via sign flow    |
| 8   | `/staking`    | Vault KPIs, validators, restake transaction flow              |
| 9   | `/x402`       | 402 terms → pay/verify/settle/access for all three resources  |

x402 resources to test:

```text
yield-rate
validator-performance
sanctions-merkle
```

MCP write tools to spot-check:

```text
issue_token
register_holder
restake
```

### 30.4 Error-handling checks

| Scenario                          | Expected UI                                           |
| --------------------------------- | ----------------------------------------------------- |
| Reject wallet signature           | Clear rejection message, no crash                     |
| Render backend cold start         | Loading state, then data or backend unavailable alert |
| Stale `.next` cache               | Restart dev server; `/api/*` returns 200 again        |
| Wallet disconnected on write page | Prompt to connect before sign/submit                  |

### 30.5 Sign-off matrix

Record for each manual run:

```text
wallet public key
route tested
transaction or settlement hash
explorer URL
pass/fail
error message if any
```

---

## 31. Files Added (updated)

```text
frontend/src/components/StructuredDataCard.tsx
frontend/src/components/TransactionReviewCard.tsx
frontend/src/types/styled-components.d.ts
frontend/lib/csprclickTheme.ts
frontend/lib/hooks/useClickReady.ts
frontend/lib/wallet/connectCasperWallet.ts
frontend/src/views/LandingPage.tsx
frontend/src/app/(dashboard)/DashboardShellLayout.tsx
frontend/src/nickelfox/components/base/echartsSetup.ts
docs/FRONTEND_INTEGRATION_STEP_BY_STEP.md
```

---

## 32. Important Files Modified (updated)

```text
frontend/next.config.mjs
frontend/src/app/layout.tsx
frontend/src/app/page.tsx
frontend/src/app/(dashboard)/layout.tsx
frontend/src/app/(dashboard)/**/page.tsx
frontend/src/providers/ClientProviders.tsx
frontend/src/providers/ClickProviderWrapper.tsx
frontend/lib/csprclick.ts
frontend/lib/api.ts
frontend/lib/hooks/useWalletSession.ts
frontend/lib/hooks/useWalletActions.ts
frontend/lib/x402.ts
frontend/src/components/Hero.tsx
frontend/src/components/Features.tsx
frontend/src/components/UseCases.tsx
frontend/src/components/Pricing.tsx
frontend/src/components/Testimonials.tsx
frontend/src/components/FAQ.tsx
frontend/src/components/CtaBanner.tsx
frontend/src/components/Footer.tsx
frontend/src/components/LandingWalletButton.tsx
frontend/src/components/TransactionStatus.tsx
frontend/src/components/WalletAccountStatus.tsx
frontend/src/components/Navbar.tsx
frontend/src/components/YieldChart.tsx
frontend/src/dashboard/components/TokenIssueForm.tsx
frontend/src/dashboard/components/StakingPanel.tsx
frontend/src/dashboard/components/X402PaymentFlow.tsx
frontend/src/dashboard/components/AuditTrail.tsx
frontend/src/dashboard/components/AgentDecisionFeed.tsx
frontend/src/dashboard/pages/McpPage.tsx
frontend/src/nickelfox/pages/dashboard/Dashboard.tsx
frontend/src/nickelfox/components/sections/dashboard/todays-sales/TodaysSales.tsx
frontend/src/nickelfox/components/sections/dashboard/top-products/TopProducts.tsx
frontend/src/nickelfox/components/sections/dashboard/level/LevelChart.tsx
frontend/src/nickelfox/components/sections/dashboard/visitor-insights/VisitorInsightsChart.tsx
frontend/src/nickelfox/components/sections/dashboard/earnings/EarningsChart.tsx
frontend/src/nickelfox/layouts/main-layout/index.tsx
frontend/src/nickelfox/layouts/main-layout/Sidebar/Sidebar.tsx
frontend/src/nickelfox/layouts/main-layout/Sidebar/NavItem.tsx
frontend/src/nickelfox/layouts/main-layout/Topbar/Topbar.tsx
frontend/src/nickelfox/theme/components/Paper.tsx
frontend/src/nickelfox/theme/components/Appbar.tsx
frontend/src/nickelfox/theme/components/Drawer.tsx
frontend/src/nickelfox/theme/components/FilledInput.tsx
frontend/tests/e2e/smoke.spec.ts
docs/reports/FRONTEND_INTEGRATION_REPORT.md
docs/FRONTEND_INTEGRATION_STEP_BY_STEP.md
```

---

## 33. Things We Explicitly Did Not Change

The following systems were not modified:

```text
backend/
contracts/
agents/
mcp-server/
x402-facilitator/
deployed/addresses.json
render.yaml
Supabase schema
Upstash config
database migrations
```

---

## 34. Current Status (updated)

Working:

- frontend builds
- local dev server runs
- all dashboard routes load without SSR 500s
- backend proxy returns live data when dev cache is clean
- MCP read proxy returns live data
- x402 unpaid resource returns 402
- x402 UI uses verify + X-Payment retry (no double settle)
- CSPR.click provider initializes with ThemeProvider + ClickUI
- wallet connect UI follows official CSPR.click docs
- landing page content matches the real MERIDIAN product
- dashboard theme/navigation polish applied
- ECharts renderer registered; dashboard charts render
- transaction review UI is user-friendly
- audit/agent data is user-friendly
- raw result JSON displays replaced with structured cards

Still requiring manual funded-wallet confirmation:

- Casper Wallet connect persistence across long sessions
- MCP write transaction signing and submission
- x402 settlement with wallet-signed payment on all three resources
- explorer confirmation for successful transactions

Known operational caveat:

- Restart dev server after `pnpm build` to avoid stale `.next` API route 500s

---

## 35. Recommended Next Step

Run the Section 30 manual test scenario with a funded Casper testnet wallet and record:

```text
wallet public key
tool/page tested
transaction hash or settlement hash
explorer URL
pass/fail
error message if any
```

After those manual checks pass, update:

```text
docs/reports/FRONTEND_INTEGRATION_REPORT.md
```

with real settlement and transaction hashes, and mark wallet-dependent test matrix rows as PASS.
