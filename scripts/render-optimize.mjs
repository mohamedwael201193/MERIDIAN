#!/usr/bin/env node
/**
 * Optimize MERIDIAN Render deployment to 3 services.
 * ONLY touches services whose names start with "meridian".
 */
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

const RENDER_KEY = env.RENDER_API_KEY || env.rebder_api_key
if (!RENDER_KEY) {
  console.error('RENDER_API_KEY missing')
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
  let json
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = { raw: text }
  }
  if (!res.ok) throw new Error(`${method} ${path} ${res.status}: ${text.slice(0, 500)}`)
  return json
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

function readPem() {
  const path = env.MERIDIAN_DEPLOYER_PRIVATE_KEY_PEM || env.ODRA_CASPER_LIVENET_SECRET_KEY_PATH
  if (!path) return ''
  if (path.includes('BEGIN')) return path
  if (existsSync(path)) return readFileSync(path, 'utf8')
  return ''
}

const services = await listMeridianServices()
console.log('Meridian services:', Object.keys(services).join(', '))

const backend = services['meridian-backend']
let x402 = services['meridian-x402-facilitator'] || services['meridian-x402']
const mcp = services['meridian-mcp-server']

const backendUrl = backend?.serviceDetails?.url || backend?.url || ''
const x402Url = x402?.serviceDetails?.url || x402?.url || 'https://meridian-x402-facilitator.onrender.com'
const deployerPem = readPem()

// Suspend redundant MERIDIAN-only services
for (const name of ['meridian-agents', 'meridian-x402-resource']) {
  const svc = services[name]
  if (!svc?.id) continue
  console.log(`Suspending ${name} (${svc.id})`)
  try {
    await api('POST', `/services/${svc.id}/suspend`)
  } catch (e) {
    console.warn(`suspend ${name}:`, e.message)
  }
}

// Update x402 facilitator -> combined mode (reuse existing service)
if (x402?.id) {
  console.log(`Updating ${x402.name} to combined x402 mode`)
  await api('PATCH', `/services/${x402.id}`, {
    name: 'meridian-x402',
    serviceDetails: {
      envSpecificDetails: {
        buildCommand:
          'pnpm install --frozen-lockfile && pnpm --filter @meridian/casper-sdk run build && pnpm --filter @meridian/x402-facilitator run build',
        startCommand: 'X402_MODE=combined node x402-facilitator/dist/index.js',
      },
      healthCheckPath: '/health',
    },
  })

  await setEnv(x402.id, [
    ['NODE_ENV', 'production'],
    ['X402_MODE', 'combined'],
    ['CASPER_RPC_URL', env.CASPER_RPC_URL],
    ['CASPER_CHAIN_NAME', env.CASPER_CHAIN_NAME || 'casper-test'],
    ['CASPER_API_KEY', env.CASPER_API_KEY],
    ['UPSTASH_REDIS_REST_URL', env.UPSTASH_REDIS_REST_URL],
    ['UPSTASH_REDIS_REST_TOKEN', env.UPSTASH_REDIS_REST_TOKEN],
    ['X402_PAY_TO_ACCOUNT_HASH', env.X402_PAY_TO_ACCOUNT_HASH],
    ['X402_PAYMENT_AMOUNT_MOTES', env.X402_PAYMENT_AMOUNT_MOTES],
    ['MERIDIAN_DEPLOYER_PRIVATE_KEY_PEM', deployerPem],
    ['X402_FACILITATOR_URL', x402Url],
    ['BACKEND_URL', backendUrl],
    ['MERIDIAN_API_KEY', env.MERIDIAN_API_KEY],
    ['MERIDIAN_VALIDATOR_PUBLIC_KEY', env.MERIDIAN_VALIDATOR_PUBLIC_KEY],
    ['OFAC_SDN_FEED_URL', env.OFAC_SDN_FEED_URL],
  ])
}

if (backend?.id) {
  console.log('Updating meridian-backend (with embedded agents)')
  await api('PATCH', `/services/${backend.id}`, {
    serviceDetails: {
      envSpecificDetails: {
        buildCommand:
          'pnpm install --frozen-lockfile && pnpm --filter @meridian/env run build && pnpm --filter @meridian/agents-shared run build && pnpm --filter @meridian/yield-agent run build && pnpm --filter @meridian/compliance-agent run build && pnpm --filter @meridian/audit-agent run build && pnpm --filter @meridian/backend run build',
        startCommand: 'node backend/dist/main.js',
      },
      healthCheckPath: '/health',
    },
  })

  await setEnv(backend.id, [
    ['NODE_ENV', 'production'],
    ['HOST', '0.0.0.0'],
    ['AGENTS_ENABLED', 'true'],
    ['AGENT_INTERVAL_MS', '300000'],
    ['DATABASE_URL', env.DATABASE_URL],
    ['SUPABASE_URL', env.SUPABASE_URL],
    ['SUPABASE_ANON_KEY', env.SUPABASE_ANON_KEY],
    ['SUPABASE_SERVICE_ROLE_KEY', env.SUPABASE_SERVICE_ROLE_KEY],
    ['UPSTASH_REDIS_REST_URL', env.UPSTASH_REDIS_REST_URL],
    ['UPSTASH_REDIS_REST_TOKEN', env.UPSTASH_REDIS_REST_TOKEN],
    ['CASPER_NETWORK', env.CASPER_NETWORK || 'casper-test'],
    ['CASPER_RPC_URL', env.CASPER_RPC_URL],
    ['CASPER_CHAIN_NAME', env.CASPER_CHAIN_NAME || 'casper-test'],
    ['CASPER_API_KEY', env.CASPER_API_KEY],
    ['CASPER_SIDE_CAR_URL', env.CASPER_SIDE_CAR_URL],
    ['CSPR_STREAMING_URL', env.CSPR_STREAMING_URL],
    ['CSPR_CLOUD_AUTH_TOKEN', env.CSPR_CLOUD_AUTH_TOKEN],
    ['MERIDIAN_API_KEY', env.MERIDIAN_API_KEY],
    ['MERIDIAN_CONTRACTS_PATH', 'deployed/addresses.json'],
    ['MERIDIAN_VALIDATOR_PUBLIC_KEY', env.MERIDIAN_VALIDATOR_PUBLIC_KEY],
    ['INDEXER_ENABLED', 'true'],
    ['INDEXER_BACKFILL_ON_START', 'true'],
    ['LOG_LEVEL', env.LOG_LEVEL || 'info'],
    ['OPENAI_API_KEY', env.OPENAI_API_KEY],
    ['OPENAI_BASE_URL', env.OPENAI_BASE_URL],
    ['OPENAI_MODEL', env.OPENAI_MODEL],
    ['CEREBRAS_API_KEY', env.CEREBRAS_API_KEY],
    ['SAMBANOVA_API_KEY', env.SAMBANOVA_API_KEY],
    ['TOGETHER_API_KEY', env.TOGETHER_API_KEY],
    ['OPENROUTER_API_KEY', env.OPENROUTER_API_KEY],
    ['GROQ_API_KEY', env.GROQ_API_KEY],
    ['GEMINI_API_KEY', env.GEMINI_API_KEY],
    ['BACKEND_URL', backendUrl],
    ['X402_FACILITATOR_URL', x402Url],
  ])
}

if (mcp?.id) {
  console.log('Updating meridian-mcp-server env')
  await setEnv(mcp.id, [
    ['NODE_ENV', 'production'],
    ['MERIDIAN_MCP_TRANSPORT', 'http'],
    ['MERIDIAN_MCP_HOST', '0.0.0.0'],
    ['BACKEND_URL', backendUrl],
    ['MERIDIAN_API_KEY', env.MERIDIAN_API_KEY],
    ['CASPER_NETWORK', env.CASPER_NETWORK || 'casper-test'],
    ['CASPER_RPC_URL', env.CASPER_RPC_URL],
    ['CASPER_CHAIN_NAME', env.CASPER_CHAIN_NAME || 'casper-test'],
    ['CASPER_API_KEY', env.CASPER_API_KEY],
    ['CASPER_SIDE_CAR_URL', env.CASPER_SIDE_CAR_URL],
    ['DATABASE_URL', env.DATABASE_URL],
    ['SUPABASE_URL', env.SUPABASE_URL],
    ['SUPABASE_ANON_KEY', env.SUPABASE_ANON_KEY],
    ['SUPABASE_SERVICE_ROLE_KEY', env.SUPABASE_SERVICE_ROLE_KEY],
    ['UPSTASH_REDIS_REST_URL', env.UPSTASH_REDIS_REST_URL],
    ['UPSTASH_REDIS_REST_TOKEN', env.UPSTASH_REDIS_REST_TOKEN],
    ['MERIDIAN_CONTRACTS_PATH', 'deployed/addresses.json'],
    ['X402_FACILITATOR_URL', x402Url],
    ['X402_RESOURCE_URL', x402Url],
    ['LOG_LEVEL', env.LOG_LEVEL || 'info'],
  ])
}

for (const name of ['meridian-backend', 'meridian-x402-facilitator', 'meridian-x402', 'meridian-mcp-server']) {
  const svc = services[name] || (name === 'meridian-x402' ? x402 : null)
  if (!svc?.id || name === 'meridian-agents' || name === 'meridian-x402-resource') continue
  console.log(`Deploying ${name}`)
  await api('POST', `/services/${svc.id}/deploys`, { clearCache: 'clear' })
}

console.log(JSON.stringify({ backendUrl, x402Url, mcpUrl: mcp?.serviceDetails?.url }, null, 2))
