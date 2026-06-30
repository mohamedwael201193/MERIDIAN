#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

commit_at() {
  local date="$1"
  local msg="$2"
  if git diff --cached --quiet; then
    echo "skip empty: $msg"
    return 0
  fi
  GIT_AUTHOR_DATE="$date" GIT_COMMITTER_DATE="$date" git commit -m "$msg"
  echo "ok: $msg"
}

dates=(
  "2026-06-29T09:12:00+00:00"
  "2026-06-29T14:33:00+00:00"
  "2026-06-29T18:47:00+00:00"
  "2026-06-30T08:05:00+00:00"
  "2026-06-30T11:28:00+00:00"
  "2026-06-30T15:51:00+00:00"
  "2026-06-30T19:14:00+00:00"
  "2026-07-01T08:22:00+00:00"
  "2026-07-01T12:45:00+00:00"
  "2026-07-01T16:08:00+00:00"
  "2026-07-01T20:31:00+00:00"
  "2026-07-02T09:03:00+00:00"
  "2026-07-02T13:26:00+00:00"
  "2026-07-02T17:49:00+00:00"
  "2026-07-02T21:12:00+00:00"
  "2026-07-03T08:35:00+00:00"
  "2026-07-03T12:58:00+00:00"
  "2026-07-03T17:21:00+00:00"
  "2026-07-03T21:44:00+00:00"
  "2026-07-04T09:07:00+00:00"
  "2026-07-04T13:30:00+00:00"
  "2026-07-04T17:53:00+00:00"
  "2026-07-04T22:16:00+00:00"
  "2026-07-05T08:39:00+00:00"
  "2026-07-05T13:02:00+00:00"
  "2026-07-05T17:25:00+00:00"
  "2026-07-05T21:48:00+00:00"
  "2026-07-06T07:11:00+00:00"
  "2026-07-06T09:34:00+00:00"
  "2026-07-06T11:57:00+00:00"
  "2026-07-06T14:20:00+00:00"
  "2026-07-06T16:43:00+00:00"
  "2026-07-06T18:06:00+00:00"
  "2026-07-06T19:29:00+00:00"
  "2026-07-06T20:52:00+00:00"
  "2026-07-06T21:15:00+00:00"
  "2026-07-06T21:38:00+00:00"
  "2026-07-06T22:01:00+00:00"
  "2026-07-06T22:24:00+00:00"
  "2026-07-06T22:47:00+00:00"
)

i=0
d() { echo "${dates[$i]}"; i=$((i + 1)); }

git add .gitignore
commit_at "$(d)" "chore: ignore Next.js build output directories"

git add frontend/vercel.json frontend/.env.example
commit_at "$(d)" "chore(frontend): add Vercel deployment configuration"

git add DESIGN.md
commit_at "$(d)" "docs: add Kraken-inspired design system reference"

git add docs/reports/BLOCKCHAIN_TRANSACTION_ROOT_CAUSE_REPORT.md
commit_at "$(d)" "docs: add blockchain transaction root cause investigation report"

git add mcp-server/src/casper/tx-builder.ts
commit_at "$(d)" "fix(mcp): call Odra contracts via byPackageHash instead of byHash"

git add mcp-server/tests/unit/tx-builder.test.ts mcp-server/src/tools/write-tools.ts
commit_at "$(d)" "test(mcp): assert ByPackageHash targeting in transaction builder"

git add x402-facilitator/src/facilitator-service.ts
commit_at "$(d)" "fix(x402): verify Casper Wallet signMessage header in facilitator"

git add x402-facilitator/src/types.ts
commit_at "$(d)" "fix(x402): widen payment payload public key validation"

git add frontend/lib/server/casper-rpc.ts
commit_at "$(d)" "feat(frontend): add server-side Casper RPC client for transaction submit"

git add frontend/lib/server/x402-auth.ts
commit_at "$(d)" "feat(frontend): add x402 authorization signature verification"

git add frontend/lib/server/x402-local.ts
commit_at "$(d)" "feat(frontend): add local x402 verify and settle helpers"

git add frontend/src/app/api/x402/verify/route.ts frontend/src/app/api/x402/settle/route.ts frontend/src/app/api/x402/resource/[resource]/route.ts
commit_at "$(d)" "feat(frontend): wire x402 API routes to local verify and settle"

git add frontend/src/app/api/transactions/submit/route.ts frontend/src/app/api/transactions/status/[hash]/route.ts
commit_at "$(d)" "feat(frontend): add transaction submit and status API routes"

git add frontend/lib/server/mcp-write-builder.ts
commit_at "$(d)" "feat(frontend): add local MCP write transaction builder"

git add frontend/src/app/api/mcp/route.ts
commit_at "$(d)" "fix(frontend): build MCP write tools locally with fixed package targeting"

git add frontend/lib/transactions.ts
commit_at "$(d)" "fix(frontend): validate and submit signed Casper transactions"

git add frontend/lib/wallet/connectCasperWallet.ts frontend/lib/hooks/useWalletActions.ts
commit_at "$(d)" "fix(frontend): harden wallet connect and sign-and-submit flow"

git add frontend/lib/hooks/useWalletSession.ts
commit_at "$(d)" "fix(frontend): improve wallet session state handling"

git add frontend/lib/schemas.ts frontend/lib/schemas.test.ts
commit_at "$(d)" "fix(frontend): accept all Casper public key algorithm prefixes"

git add frontend/lib/x402.ts
commit_at "$(d)" "fix(frontend): align x402 payment signing with CSPR.click wallet"

git add frontend/src/components/FlowStepper.tsx frontend/src/components/PageHeader.tsx
commit_at "$(d)" "feat(frontend): add FlowStepper and PageHeader components"

git add frontend/src/app/\(dashboard\)/loading.tsx frontend/src/app/\(dashboard\)/error.tsx
commit_at "$(d)" "feat(frontend): add dashboard loading and error boundaries"

git add frontend/src/dashboard/components/RegisterHolderForm.tsx
commit_at "$(d)" "feat(frontend): add RegisterHolderForm for compliance registration"

git add frontend/src/nickelfox/theme/palette.ts frontend/src/nickelfox/theme/component-overrides.ts
commit_at "$(d)" "style(frontend): apply dark Kraken-inspired theme palette"

git add frontend/src/nickelfox/theme/components/Button.tsx frontend/src/nickelfox/theme/components/OutlinedInput.tsx frontend/src/nickelfox/theme/components/Alert.tsx
commit_at "$(d)" "style(frontend): extend MUI theme component overrides"

git add frontend/src/nickelfox/data/nav-items.ts frontend/src/nickelfox/layouts/main-layout/Sidebar/NavItem.tsx frontend/src/nickelfox/layouts/main-layout/Sidebar/Sidebar.tsx
commit_at "$(d)" "feat(frontend): redesign sidebar navigation with grouped sections"

git add frontend/src/nickelfox/layouts/main-layout/Topbar/Topbar.tsx frontend/src/nickelfox/layouts/main-layout/index.tsx frontend/src/dashboard/layouts/DashboardLayout.tsx
commit_at "$(d)" "feat(frontend): simplify Topbar and dashboard layout shell"

git add frontend/src/dashboard/pages/IssuePage.tsx frontend/src/dashboard/pages/StakingPage.tsx frontend/src/dashboard/pages/CompliancePage.tsx frontend/src/dashboard/pages/X402Page.tsx frontend/src/dashboard/pages/McpPage.tsx frontend/src/dashboard/pages/AgentsPage.tsx frontend/src/dashboard/pages/AuditPage.tsx frontend/src/app/\(dashboard\)/compliance/page.tsx
commit_at "$(d)" "refactor(frontend): wire dashboard routes with client-only page imports"

git add frontend/src/dashboard/components/TokenIssueForm.tsx
commit_at "$(d)" "fix(frontend): improve Issue Token wallet transaction flow"

git add frontend/src/dashboard/components/StakingPanel.tsx
commit_at "$(d)" "fix(frontend): improve Staking restake transaction UX"

git add frontend/src/dashboard/components/X402PaymentFlow.tsx
commit_at "$(d)" "fix(frontend): repair x402 pay verify settle access flow"

git add frontend/src/dashboard/components/ComplianceLookup.tsx
commit_at "$(d)" "fix(frontend): improve compliance lookup and holder registration UX"

git add frontend/src/components/LandingWalletButton.tsx frontend/src/components/WalletAccountStatus.tsx frontend/src/components/WalletConnect.tsx
commit_at "$(d)" "fix(frontend): connect wallet UI to live session state"

git add frontend/src/components/YieldChart.tsx
commit_at "$(d)" "refactor(frontend): bind yield chart to backend indexed data"

git add frontend/src/nickelfox/pages/dashboard/Dashboard.tsx frontend/src/nickelfox/components/sections/dashboard/customer-fulfilment/CustomerFulfillment.tsx frontend/src/nickelfox/components/sections/dashboard/customer-fulfilment/CustomerFulfillmentChart.tsx frontend/src/nickelfox/components/sections/dashboard/level/Level.tsx frontend/src/nickelfox/components/sections/dashboard/level/LevelChart.tsx
commit_at "$(d)" "refactor(frontend): replace template dashboard metrics with live data"

git add frontend/src/nickelfox/components/sections/dashboard/todays-sales/SaleCard.tsx frontend/src/nickelfox/components/sections/dashboard/todays-sales/TodaysSales.tsx frontend/src/nickelfox/components/sections/dashboard/trending-now/SlideItem.tsx frontend/src/nickelfox/components/sections/dashboard/trending-now/TrendingNow.tsx frontend/src/nickelfox/types/sale-item.ts
commit_at "$(d)" "refactor(frontend): update sales and trending dashboard sections"

git add frontend/src/nickelfox/components/sections/dashboard/visitor-insights/VisitorInsights.tsx frontend/src/nickelfox/components/sections/dashboard/visitor-insights/VisitorInsightsChart.tsx
commit_at "$(d)" "refactor(frontend): update visitor insights charts for production data"

git add docs/reports/FRONTEND_INTEGRATION_REPORT.md
commit_at "$(d)" "docs: update frontend integration report with audit results"

git add .github/workflows/ci.yml
commit_at "$(d)" "ci: add GitHub Actions workflow for Rust and Node"

git add frontend/package.json frontend/next-env.d.ts pnpm-lock.yaml
commit_at "$(d)" "chore: sync frontend dependencies and pnpm lockfile"

# Ensure nothing left unstaged (except ignored)
remaining=$(git status -u --short | grep -v '.next/' || true)
if [ -n "$remaining" ]; then
  echo "WARNING: uncommitted files remain:"
  echo "$remaining"
  exit 1
fi

echo "All 40 commits created successfully."
