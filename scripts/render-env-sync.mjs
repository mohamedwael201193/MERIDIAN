#!/usr/bin/env node
/** Sync MERIDIAN Render env vars from local .env — no deploy trigger. */
import { readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const env = {}
if (existsSync(join(ROOT, '.env'))) {
  for (const line of readFileSync(join(ROOT, '.env'), 'utf8').split('\n')) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/)
    if (m) env[m[1]] = m[2]
  }
}

const RENDER_KEY =
  process.env.RENDER_API_KEY || process.env.render_api_key || env.render_api_key
if (!RENDER_KEY) {
  console.error('render_api_key missing in .env')
  process.exit(1)
}

const AUTH = { Authorization: `Bearer ${RENDER_KEY}`, 'Content-Type': 'application/json' }

async function api(method, path, body) {
  const res = await fetch(`https://api.render.com/v1${path}`, {
    method,
    headers: AUTH,
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`${method} ${path} ${res.status}: ${text.slice(0, 500)}`)
  return text ? JSON.parse(text) : null
}

async function listMeridianServices() {
  const rows = await api('GET', '/services?limit=100')
  const map = {}
  for (const row of rows) {
    const s = row.service || row
    if (s.name?.startsWith('meridian')) map[s.name] = s
  }
  return map
}

async function setEnv(serviceId, pairs) {
  const body = pairs
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([key, value]) => ({ key, value: String(value) }))
  if (body.length === 0) return
  await api('PUT', `/services/${serviceId}/env-vars`, body)
}

function resolveEnvPem(key) {
  const value = process.env[key] || env[key]
  if (!value) return ''
  if (value.includes('BEGIN')) return value.replace(/\\n/g, '\n')
  return ''
}

const services = await listMeridianServices()
const backend = services['meridian-backend']
const x402 = services['meridian-x402-facilitator'] || services['meridian-x402']
const mcp = services['meridian-mcp-server']

const backendUrl =
  env.BACKEND_URL_PRODUCTION ||
  backend?.serviceDetails?.url ||
  backend?.url ||
  'https://meridian-backend-ikx8.onrender.com'
const x402Url =
  env.X402_FACILITATOR_URL ||
  x402?.serviceDetails?.url ||
  x402?.url ||
  'https://meridian-x402-facilitator.onrender.com'
const mcpUrl =
  env.NEXT_PUBLIC_MCP_SERVER_URL ||
  mcp?.serviceDetails?.url ||
  mcp?.url ||
  'https://meridian-mcp-server-94q4.onrender.com'

const deployerPem = resolveEnvPem('MERIDIAN_DEPLOYER_PRIVATE_KEY_PEM')
const yieldPem = resolveEnvPem('MERIDIAN_YIELD_AGENT_PRIVATE_KEY_PEM')
const compliancePem = resolveEnvPem('MERIDIAN_COMPLIANCE_AGENT_PRIVATE_KEY_PEM')
const auditPem = resolveEnvPem('MERIDIAN_AUDIT_AGENT_PRIVATE_KEY_PEM')

if (backend?.id) {
  console.log('Syncing meridian-backend env')
  await setEnv(backend.id, [
    ['MERIDIAN_CONTRACTS_PATH', 'deployed/addresses.json'],
    ['BACKEND_URL', backendUrl],
    ['X402_FACILITATOR_URL', x402Url],
    ['CSPR_CLOUD_AUTH_TOKEN', env.CSPR_CLOUD_AUTH_TOKEN || env.CASPER_API_KEY],
    ['CASPER_RPC_URL', env.CASPER_RPC_URL || 'https://node.testnet.cspr.cloud/rpc'],
    ['CASPER_SIDE_CAR_URL', env.CASPER_SIDE_CAR_URL || 'https://api.testnet.cspr.cloud'],
    ['CSPR_STREAMING_URL', env.CSPR_STREAMING_URL],
    ['MERIDIAN_API_KEY', env.MERIDIAN_API_KEY],
    ['DATABASE_URL', env.DATABASE_URL],
    ['SUPABASE_URL', env.SUPABASE_URL],
    ['SUPABASE_ANON_KEY', env.SUPABASE_ANON_KEY],
    ['SUPABASE_SERVICE_ROLE_KEY', env.SUPABASE_SERVICE_ROLE_KEY],
    ['UPSTASH_REDIS_REST_URL', env.UPSTASH_REDIS_REST_URL],
    ['UPSTASH_REDIS_REST_TOKEN', env.UPSTASH_REDIS_REST_TOKEN],
    ['CASPER_API_KEY', env.CASPER_API_KEY],
    ['CASPER_CHAIN_NAME', env.CASPER_CHAIN_NAME || 'casper-test'],
    ['CASPER_NETWORK', env.CASPER_NETWORK || 'casper-test'],
    ['MERIDIAN_YIELD_AGENT_PRIVATE_KEY_PEM', yieldPem],
    ['MERIDIAN_COMPLIANCE_AGENT_PRIVATE_KEY_PEM', compliancePem],
    ['MERIDIAN_AUDIT_AGENT_PRIVATE_KEY_PEM', auditPem],
  ])
}

if (x402?.id) {
  console.log(`Syncing ${x402.name} env`)
  await setEnv(x402.id, [
    ['BACKEND_URL', backendUrl],
    ['X402_FACILITATOR_URL', x402Url],
    ['X402_RESOURCE_URL', x402Url],
    ['MERIDIAN_API_KEY', env.MERIDIAN_API_KEY],
    ['CASPER_API_KEY', env.CASPER_API_KEY],
    ['CASPER_RPC_URL', env.CASPER_RPC_URL || 'https://node.testnet.cspr.cloud/rpc'],
    ['CASPER_CHAIN_NAME', env.CASPER_CHAIN_NAME || 'casper-test'],
    ['UPSTASH_REDIS_REST_URL', env.UPSTASH_REDIS_REST_URL],
    ['UPSTASH_REDIS_REST_TOKEN', env.UPSTASH_REDIS_REST_TOKEN],
    ['X402_PAY_TO_ACCOUNT_HASH', env.X402_PAY_TO_ACCOUNT_HASH],
    ['X402_PAYMENT_AMOUNT_MOTES', env.X402_PAYMENT_AMOUNT_MOTES],
    ['MERIDIAN_DEPLOYER_PRIVATE_KEY_PEM', deployerPem],
    ['MERIDIAN_TOKEN_PACKAGE', env.MERIDIAN_TOKEN_PACKAGE],
  ])
}

if (mcp?.id) {
  console.log('Syncing meridian-mcp-server env')
  await setEnv(mcp.id, [
    ['MERIDIAN_CONTRACTS_PATH', 'deployed/addresses.json'],
    ['BACKEND_URL', backendUrl],
    ['MERIDIAN_API_KEY', env.MERIDIAN_API_KEY],
    ['CASPER_API_KEY', env.CASPER_API_KEY],
    ['CASPER_RPC_URL', env.CASPER_RPC_URL || 'https://node.testnet.cspr.cloud/rpc'],
    ['CASPER_SIDE_CAR_URL', env.CASPER_SIDE_CAR_URL || 'https://api.testnet.cspr.cloud'],
    ['CASPER_CHAIN_NAME', env.CASPER_CHAIN_NAME || 'casper-test'],
    ['CASPER_NETWORK', env.CASPER_NETWORK || 'casper-test'],
    ['DATABASE_URL', env.DATABASE_URL],
    ['SUPABASE_URL', env.SUPABASE_URL],
    ['SUPABASE_ANON_KEY', env.SUPABASE_ANON_KEY],
    ['SUPABASE_SERVICE_ROLE_KEY', env.SUPABASE_SERVICE_ROLE_KEY],
    ['UPSTASH_REDIS_REST_URL', env.UPSTASH_REDIS_REST_URL],
    ['UPSTASH_REDIS_REST_TOKEN', env.UPSTASH_REDIS_REST_TOKEN],
    ['X402_FACILITATOR_URL', x402Url],
    ['X402_RESOURCE_URL', x402Url],
  ])
}

console.log(JSON.stringify({ backendUrl, x402Url, mcpUrl }, null, 2))

for (const name of ['meridian-backend', 'meridian-mcp-server', 'meridian-x402']) {
  const svc = services[name] || (name === 'meridian-x402' ? x402 : null)
  if (!svc?.id) continue
  console.log(`Triggering deploy: ${name}`)
  await api('POST', `/services/${svc.id}/deploys`, { clearCache: 'clear' })
}
