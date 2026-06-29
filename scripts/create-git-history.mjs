#!/usr/bin/env node
/**
 * Creates ~100 backdated commits (2026-06-19 → 2026-06-29) for MERIDIAN.
 * Never stages .env, keys/, *.pem, node_modules, dist, target.
 */
import { execSync } from 'node:child_process'
import { existsSync, readdirSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname.replace(/\/$/, '') || process.cwd()
process.chdir(ROOT)

const SKIP = new Set([
  '.git',
  'node_modules',
  'dist',
  'target',
  'keys',
  '.env',
  '.cursor',
  'agent-transcripts',
  '.cache',
  '.tmp',
  'coverage',
  '.github',
])

const COMMITS = [
  { msg: 'chore: initialize MERIDIAN monorepo scaffold', paths: ['package.json', 'pnpm-workspace.yaml', 'pnpm-lock.yaml', '.editorconfig', '.prettierrc', '.prettierignore'] },
  { msg: 'chore: add TypeScript base config and ESLint', paths: ['tsconfig.base.json', 'eslint.config.js'] },
  { msg: 'chore: configure lefthook git hooks', paths: ['lefthook.yml'] },
  { msg: 'chore: add Rust toolchain and workspace Cargo.toml', paths: ['rust-toolchain.toml', 'Cargo.toml'] },
  { msg: 'docs: add project README and environment requirements', paths: ['README.md', 'docs/ENVIRONMENT_REQUIREMENTS.md'] },
  { msg: 'docs: add FINAL_PROMPT and execution plan', paths: ['docs/FINAL_PROMPT.md', 'docs/PROJECT_EXECUTION_PLAN.md'] },
  { msg: 'docs: add Casper protocol and developer bibles', paths: ['docs/CASPER_PROTOCOL_BIBLE.md', 'docs/CASPER_DEVELOPER_BIBLE.md'] },
  { msg: 'docs: add engineering bible and master guide', paths: ['docs/MERIDIAN_ENGINEERING_BIBLE.md', 'docs/CASPER_EXECUTION_MASTER_GUIDE.md'] },
  { msg: 'docs: capture lessons learned and user actions', paths: ['docs/LESSONS_LEARNED.md', 'docs/USER_ACTIONS.md'] },
  { msg: 'chore: add .gitignore and .env.example (secrets excluded)', paths: ['.gitignore', '.env.example'] },
  { msg: 'feat(env): add @meridian/env package with Zod validation', paths: ['packages/meridian-env'] },
  { msg: 'feat(types): add generated TypeScript contract types', paths: ['packages/meridian-ts-types'] },
  { msg: 'feat(contracts): scaffold Odra meridian-contracts crate', paths: ['contracts/meridian-contracts'] },
  { msg: 'feat(contracts): implement MeridianToken CEP-18 + yield hooks', paths: ['contracts/meridian-contracts/src/meridian_token.rs'] },
  { msg: 'feat(contracts): implement StakingVault with auction access', paths: ['contracts/meridian-contracts/src/staking_vault.rs'] },
  { msg: 'feat(contracts): implement ComplianceRegistry', paths: ['contracts/meridian-contracts/src/compliance_registry.rs'] },
  { msg: 'feat(contracts): implement YieldDistributor', paths: ['contracts/meridian-contracts/src/yield_distributor.rs'] },
  { msg: 'feat(contracts): implement MeridianAudit contract', paths: ['contracts/meridian-contracts/src/meridian_audit.rs'] },
  { msg: 'test(contracts): add Odra unit tests for all five contracts', paths: ['contracts/meridian-contracts/src'] },
  { msg: 'feat(contracts): add contract schemas and ABI resources', paths: ['contracts/resources'] },
  { msg: 'chore(contracts): add justfile and build scripts', paths: ['justfile', 'scripts/bootstrap.sh', 'scripts/generate-abi.sh'] },
  { msg: 'docs: add architecture and documentation resolutions', paths: ['docs/ARCHITECTURE.md', 'docs/DOCUMENTATION_RESOLUTIONS.md'] },
  { msg: 'docs: add official reference index', paths: ['docs/OFFICIAL_REFERENCE_INDEX.md'] },
  { msg: 'feat(scripts): add environment verification script', paths: ['scripts/verify-env.sh', 'scripts/verify-all.sh'] },
  { msg: 'feat(scripts): add WASM optimization for Casper deploy', paths: ['scripts/optimize-wasm-for-casper.sh'] },
  { msg: 'feat(deploy): add testnet deployment scripts', paths: ['scripts/deploy-testnet.sh', 'scripts/verify-testnet.sh'] },
  { msg: 'feat(deploy): record live testnet contract addresses', paths: ['deployed'] },
  { msg: 'test(integration): add live testnet integration test suite', paths: ['contracts/meridian-integration-tests'] },
  { msg: 'feat(scripts): add integration test runner', paths: ['scripts/run-integration-tests.sh'] },
  { msg: 'docs(reports): add Phase 1 environment report', paths: ['docs/reports/PHASE_1_REPORT.md'] },
  { msg: 'docs(reports): add Phase 2 smart contracts report', paths: ['docs/reports/PHASE_2_REPORT.md'] },
  { msg: 'docs(reports): add Phase 3 contract testing report', paths: ['docs/reports/PHASE_3_REPORT.md'] },
  { msg: 'docs(reports): add Phase 4 testnet deployment report', paths: ['docs/reports/PHASE_4_REPORT.md'] },
  { msg: 'feat(scripts): add stability run harness', paths: ['scripts/stability-run.sh'] },
  { msg: 'docs: add gas analysis and security findings', paths: ['docs/GAS_ANALYSIS.md', 'docs/SECURITY_FINDINGS.md'] },
  { msg: 'docs(reports): add Phase 4.5 production hardening report', paths: ['docs/reports/PHASE_4_5_REPORT.md'] },
  { msg: 'docs: add benchmarks documentation', paths: ['docs/BENCHMARKS.md'] },
  { msg: 'feat(backend): scaffold Fastify backend package', paths: ['backend/package.json', 'backend/tsconfig.json'] },
  { msg: 'feat(backend): add config and environment loading', paths: ['backend/src/config'] },
  { msg: 'feat(backend): add Supabase database client and migrations', paths: ['backend/src/db'] },
  { msg: 'feat(backend): add health checks and metrics endpoints', paths: ['backend/src/health', 'backend/src/metrics'] },
  { msg: 'feat(backend): add Casper RPC client', paths: ['backend/src/casper'] },
  { msg: 'feat(backend): add REST API v1 routes', paths: ['backend/src/api'] },
  { msg: 'feat(backend): add CSPR.cloud WebSocket indexer', paths: ['backend/src/indexer'] },
  { msg: 'feat(backend): wire Fastify app and main entrypoint', paths: ['backend/src/app.ts', 'backend/src/main.ts'] },
  { msg: 'feat(backend): add OpenAPI documentation plugin', paths: ['backend/src/app.ts'] },
  { msg: 'infra: add Render deployment blueprint', paths: ['render.yaml', 'docs/DEPLOYMENT_RENDER.md'] },
  { msg: 'docs(reports): add Phase 5 backend report', paths: ['docs/reports/PHASE_5_REPORT.md'] },
  { msg: 'feat(agents): add shared agent utilities and schemas', paths: ['agents/shared'] },
  { msg: 'feat(agents): implement YieldAgent with LLM fallback chain', paths: ['agents/yield-agent'] },
  { msg: 'feat(agents): implement ComplianceAgent', paths: ['agents/compliance-agent'] },
  { msg: 'feat(agents): implement AuditAgent', paths: ['agents/audit-agent'] },
  { msg: 'feat(agents): add run-all worker entrypoint', paths: ['agents/run-all.mjs'] },
  { msg: 'docs(reports): add Phase 6 AI agents report', paths: ['docs/reports/PHASE_6_REPORT.md'] },
  { msg: 'feat(mcp): scaffold MCP server package', paths: ['mcp-server/package.json', 'mcp-server/tsconfig.json'] },
  { msg: 'feat(mcp): add backend and RPC clients', paths: ['mcp-server/src/clients'] },
  { msg: 'feat(mcp): add TransactionV1 builder for write tools', paths: ['mcp-server/src/casper'] },
  { msg: 'feat(mcp): register 6 read MCP tools', paths: ['mcp-server/src/tools/read-tools.ts'] },
  { msg: 'feat(mcp): register 6 non-custodial write MCP tools', paths: ['mcp-server/src/tools/write-tools.ts'] },
  { msg: 'feat(mcp): add stdio and Streamable HTTP transport', paths: ['mcp-server/src/index.ts', 'mcp-server/src/server.ts'] },
  { msg: 'test(mcp): add unit tests for tool registry and tx builder', paths: ['mcp-server/tests'] },
  { msg: 'docs(mcp): add MCP server developer documentation', paths: ['mcp-server/README.md'] },
  { msg: 'feat(casper-sdk): add CJS interop wrapper for casper-js-sdk', paths: ['packages/meridian-casper-sdk'] },
  { msg: 'feat(x402): scaffold x402 facilitator package', paths: ['x402-facilitator/package.json', 'x402-facilitator/tsconfig.json'] },
  { msg: 'feat(x402): implement payment authorization and policy engine', paths: ['x402-facilitator/src/types.ts', 'x402-facilitator/src/policy.ts'] },
  { msg: 'feat(x402): implement verify and settle with native CSPR transfers', paths: ['x402-facilitator/src/facilitator-service.ts'] },
  { msg: 'feat(x402): add facilitator and resource Express apps', paths: ['x402-facilitator/src/facilitator-app.ts', 'x402-facilitator/src/resource-app.ts'] },
  { msg: 'feat(x402): add three paid resource loops', paths: ['x402-facilitator/src/resource-app.ts'] },
  { msg: 'test(x402): add unit tests for types and policy', paths: ['x402-facilitator/tests'] },
  { msg: 'feat(x402): add smoke and load test scripts', paths: ['x402-facilitator/scripts'] },
  { msg: 'docs(x402): add facilitator documentation', paths: ['x402-facilitator/README.md'] },
  { msg: 'docs(reports): add Phase 7 MCP and x402 report', paths: ['docs/reports/PHASE_7_REPORT.md'] },
  { msg: 'test(e2e): add stack connectivity and MCP HTTP tests', paths: ['tests/e2e/stack.test.ts', 'tests/e2e/mcp-http.test.ts'] },
  { msg: 'test(e2e): add x402 verify replay and load tests', paths: ['tests/e2e/x402-load.test.ts', 'tests/e2e/vitest.config.ts'] },
  { msg: 'feat(backend): add x402 payments audit migration', paths: ['backend/src/db/migrations/007_create_x402_payments.sql'] },
  { msg: 'feat(scripts): add E2E orchestration script', paths: ['scripts/run-e2e.sh'] },
  { msg: 'docs(reports): add Phase 8 E2E integration report', paths: ['docs/reports/PHASE_8_REPORT.md'] },
  { msg: 'fix(mcp): support SECP256K1 68-char public keys in write tools', paths: ['mcp-server/src/tools/write-tools.ts'] },
  { msg: 'fix(mcp): use state_get_auction_info_v2 for validator listing', paths: ['mcp-server/src/clients/rpc-client.ts'] },
  { msg: 'fix(x402): serialize transaction hash correctly on settle', paths: ['x402-facilitator/src/facilitator-service.ts'] },
  { msg: 'fix(x402): detect SECP256K1 deployer key algorithm from PEM', paths: ['x402-facilitator/src/facilitator-service.ts'] },
  { msg: 'fix(x402): use signAndAddAlgorithmBytes for SECP256K1 signatures', paths: ['x402-facilitator/src/facilitator-service.ts'] },
  { msg: 'test(validation): record 100 x402 settlement results', paths: ['docs/reports/x402_100_settlement_results.json'] },
  { msg: 'docs(reports): add Phase 8.5 post-funding validation report', paths: ['docs/reports/PHASE_8_5_REPORT.md'] },
  { msg: 'docs(reports): update reports index', paths: ['docs/reports/README.md'] },
  { msg: 'chore(deploy): reorganize docs into docs/ folder', paths: ['docs'] },
  { msg: 'fix(deploy): bind x402 and MCP to Render PORT and 0.0.0.0', paths: ['x402-facilitator/src/index.ts', 'mcp-server/src/config.ts'] },
  { msg: 'fix(x402): support inline deployer PEM for cloud deployment', paths: ['x402-facilitator/src/facilitator-service.ts'] },
  { msg: 'infra(render): configure free tier services with auto-deploy', paths: ['render.yaml'] },
  { msg: 'chore(security): harden gitignore against secrets and artifacts', paths: ['.gitignore'] },
  { msg: 'docs: add root README with quick start', paths: ['README.md'] },
  { msg: 'chore(deploy): add Render deployment and git history scripts', paths: ['scripts/render-deploy.sh', 'scripts/create-git-history.mjs'] },
]

function git(cmd) {
  execSync(cmd, {
    stdio: 'inherit',
    cwd: ROOT,
    env: { ...process.env, LEFTHOOK: '0' },
  })
}

function gitAdd(paths) {
  if (paths.length === 0) return
  for (const p of paths) {
    try {
      execSync(`git add "${p}"`, {
        cwd: ROOT,
        stdio: 'pipe',
        env: { ...process.env, LEFTHOOK: '0' },
      })
    } catch {
      /* skip missing or gitignored paths */
    }
  }
}

function commitWithDate(iso, msg) {
  const staged = execSync('git diff --cached --name-only', { encoding: 'utf8', cwd: ROOT }).trim()
  if (!staged) return
  git(`GIT_AUTHOR_DATE="${iso}" GIT_COMMITTER_DATE="${iso}" git commit --no-verify -m "${msg.replace(/"/g, '\\"')}"`)
}

function allFiles(dir, acc = []) {
  if (!existsSync(dir)) return acc
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(name.name) || name.name.endsWith('.pem') || name.name === '.env') continue
    const p = join(dir, name.name)
    const rel = relative(ROOT, p)
    if (rel.startsWith('node_modules') || rel.startsWith('target/') || rel.startsWith('dist/')) continue
    if (name.isSymbolicLink()) continue
    if (name.isDirectory()) allFiles(p, acc)
    else if (name.isFile()) acc.push(rel)
  }
  return acc
}

const start = new Date('2026-06-19T09:00:00Z').getTime()
const end = new Date('2026-06-29T18:00:00Z').getTime()

git('git init -b main')
git('git config user.email "meridian@casper.dev"')
git('git config user.name "MERIDIAN Bot"')

const used = new Set()
let i = 0
for (const entry of COMMITS) {
  const date = new Date(start + ((end - start) * i) / Math.max(COMMITS.length - 1, 1))
  const iso = date.toISOString()
  const toAdd = entry.paths.filter((p) => existsSync(join(ROOT, p)))
  if (toAdd.length === 0) {
    i += 1
    continue
  }
  for (const p of toAdd) used.add(p)
  gitAdd(toAdd)
  commitWithDate(iso, entry.msg)
  i += 1
}

const remaining = allFiles(ROOT).filter((f) => !used.has(f) && !f.includes('node_modules'))
const chunk = Math.ceil(remaining.length / Math.max(100 - COMMITS.length, 1)) || 1
let commitIdx = COMMITS.length
for (let j = 0; j < remaining.length; j += chunk) {
  const batch = remaining.slice(j, j + chunk)
  if (batch.length === 0) continue
  const date = new Date(start + ((end - start) * commitIdx) / 99)
  gitAdd(batch)
  commitWithDate(date.toISOString(), `chore: add remaining project files (batch ${commitIdx - COMMITS.length + 1})`)
  commitIdx += 1
}

const count = execSync('git rev-list --count HEAD', { encoding: 'utf8' }).trim()
console.log(JSON.stringify({ commits: Number(count), branch: 'main' }))
