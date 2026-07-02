#!/usr/bin/env node
/**
 * Provision MERIDIAN Render services and upload env vars from .env (never committed).
 */
import { readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const envPath = join(ROOT, '.env')
const env = {}
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
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
const OWNER_ID = 'tea-d80krqjeo5us73fkgsu0'
const REPO = 'https://github.com/mohamedwael201193/MERIDIAN'
const BRANCH = 'main'

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

async function listServices() {
  const rows = await api('GET', '/services?limit=100')
  const map = {}
  for (const row of rows) {
    const s = row.service || row
    if (s.name?.startsWith('meridian')) map[s.name] = s
  }
  return map
}

async function createWeb(name, buildCommand, startCommand, healthCheckPath = '/health') {
  return api('POST', '/services', {
    type: 'web_service',
    name,
    ownerId: OWNER_ID,
    repo: REPO,
    branch: BRANCH,
    region: 'frankfurt',
    plan: 'free',
    autoDeploy: 'yes',
    serviceDetails: {
      env: 'node',
      envSpecificDetails: { buildCommand, startCommand },
      healthCheckPath,
    },
  })
}

async function createWorker(name, buildCommand, startCommand) {
  return api('POST', '/services', {
    type: 'background_worker',
    name,
    ownerId: OWNER_ID,
    repo: REPO,
    branch: BRANCH,
    region: 'frankfurt',
    plan: 'free',
    autoDeploy: 'yes',
    serviceDetails: {
      env: 'node',
      envSpecificDetails: { buildCommand, startCommand },
    },
  })
}

async function setMany(serviceId, pairs) {
  const body = pairs
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([key, value]) => ({ key, value: String(value) }))
  if (body.length === 0) return
  await api('PUT', `/services/${serviceId}/env-vars`, body)
}

function readPem() {
  const value = env.MERIDIAN_DEPLOYER_PRIVATE_KEY_PEM
  if (!value) return ''
  if (value.includes('BEGIN')) return value.replace(/\\n/g, '\n')
  return ''
}

const SPECS = [
  {
    name: 'meridian-backend',
    kind: 'web',
    build:
      'pnpm install --frozen-lockfile && pnpm --filter @meridian/env run build && pnpm --filter @meridian/backend run build',
    start: 'node backend/dist/main.js',
    health: '/health',
  },
  {
    name: 'meridian-agents',
    kind: 'worker',
    build:
      'pnpm install --frozen-lockfile && pnpm --filter @meridian/env run build && pnpm --filter @meridian/agents-shared run build && pnpm --filter @meridian/yield-agent run build && pnpm --filter @meridian/compliance-agent run build && pnpm --filter @meridian/audit-agent run build',
    start: 'node agents/run-all.mjs',
  },
  {
    name: 'meridian-x402-facilitator',
    kind: 'web',
    build:
      'pnpm install --frozen-lockfile && pnpm --filter @meridian/casper-sdk run build && pnpm --filter @meridian/x402-facilitator run build',
    start: 'node x402-facilitator/dist/index.js',
    health: '/health',
  },
  {
    name: 'meridian-x402-resource',
    kind: 'web',
    build: 'pnpm install --frozen-lockfile && pnpm --filter @meridian/x402-facilitator run build',
    start: 'X402_MODE=resource node x402-facilitator/dist/index.js',
    health: '/health',
  },
  {
    name: 'meridian-mcp-server',
    kind: 'web',
    build:
      'pnpm install --frozen-lockfile && pnpm --filter @meridian/env run build && pnpm --filter @meridian/casper-sdk run build && pnpm --filter @meridian/mcp-server run build',
    start: 'MERIDIAN_MCP_TRANSPORT=http node mcp-server/dist/index.js',
    health: '/health',
  },
]

const existing = await listServices()
const services = { ...existing }

for (const spec of SPECS) {
  if (services[spec.name]) {
    console.log(`exists: ${spec.name} ${services[spec.name].id}`)
    continue
  }
  console.log(`creating: ${spec.name}`)
  try {
    const resp =
      spec.kind === 'worker'
        ? await createWorker(spec.name, spec.build, spec.start)
        : await createWeb(spec.name, spec.build, spec.start, spec.health)
    services[spec.name] = resp.service
    console.log(`created: ${spec.name} ${resp.service.id} ${resp.service.serviceDetails?.url || ''}`)
  } catch (e) {
    console.error(`failed ${spec.name}:`, e.message)
  }
}

const urls = Object.fromEntries(
  Object.entries(services).map(([n, s]) => [n, s.serviceDetails?.url || s.url || '']),
)

const backendId = services['meridian-backend']?.id
const agentsId = services['meridian-agents']?.id
const x402Id = services['meridian-x402-facilitator']?.id
const resourceId = services['meridian-x402-resource']?.id
const mcpId = services['meridian-mcp-server']?.id
const deployerPem = readPem()

if (backendId) {
  console.log('env -> meridian-backend')
  await setMany(backendId, [
    ['NODE_ENV', 'production'],
    ['HOST', '0.0.0.0'],
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
    ['INDEXER_ENABLED', 'true'],
    ['INDEXER_BACKFILL_ON_START', 'true'],
    ['LOG_LEVEL', env.LOG_LEVEL || 'info'],
    ['X402_FACILITATOR_URL', urls['meridian-x402-facilitator']],
  ])
}

if (agentsId) {
  console.log('env -> meridian-agents')
  await setMany(agentsId, [
    ['NODE_ENV', 'production'],
    ['DATABASE_URL', env.DATABASE_URL],
    ['UPSTASH_REDIS_REST_URL', env.UPSTASH_REDIS_REST_URL],
    ['UPSTASH_REDIS_REST_TOKEN', env.UPSTASH_REDIS_REST_TOKEN],
    ['OPENAI_API_KEY', env.OPENAI_API_KEY],
    ['OPENAI_BASE_URL', env.OPENAI_BASE_URL],
    ['OPENAI_MODEL', env.OPENAI_MODEL],
    ['CEREBRAS_API_KEY', env.CEREBRAS_API_KEY],
    ['SAMBANOVA_API_KEY', env.SAMBANOVA_API_KEY],
    ['TOGETHER_API_KEY', env.TOGETHER_API_KEY],
    ['OPENROUTER_API_KEY', env.OPENROUTER_API_KEY],
    ['GROQ_API_KEY', env.GROQ_API_KEY],
    ['GEMINI_API_KEY', env.GEMINI_API_KEY],
    ['CASPER_RPC_URL', env.CASPER_RPC_URL],
    ['CASPER_API_KEY', env.CASPER_API_KEY],
    ['MERIDIAN_API_KEY', env.MERIDIAN_API_KEY],
    ['BACKEND_URL', urls['meridian-backend']],
  ])
}

if (x402Id) {
  console.log('env -> meridian-x402-facilitator')
  await setMany(x402Id, [
    ['NODE_ENV', 'production'],
    ['X402_MODE', 'facilitator'],
    ['CASPER_RPC_URL', env.CASPER_RPC_URL],
    ['CASPER_CHAIN_NAME', env.CASPER_CHAIN_NAME || 'casper-test'],
    ['CASPER_API_KEY', env.CASPER_API_KEY],
    ['UPSTASH_REDIS_REST_URL', env.UPSTASH_REDIS_REST_URL],
    ['UPSTASH_REDIS_REST_TOKEN', env.UPSTASH_REDIS_REST_TOKEN],
    ['X402_PAY_TO_ACCOUNT_HASH', env.X402_PAY_TO_ACCOUNT_HASH],
    ['X402_PAYMENT_AMOUNT_MOTES', env.X402_PAYMENT_AMOUNT_MOTES],
    ['MERIDIAN_DEPLOYER_PRIVATE_KEY_PEM', deployerPem],
  ])
}

if (resourceId) {
  console.log('env -> meridian-x402-resource')
  await setMany(resourceId, [
    ['NODE_ENV', 'production'],
    ['X402_MODE', 'resource'],
    ['X402_FACILITATOR_URL', urls['meridian-x402-facilitator']],
    ['BACKEND_URL', urls['meridian-backend']],
    ['MERIDIAN_API_KEY', env.MERIDIAN_API_KEY],
  ])
}

if (mcpId) {
  console.log('env -> meridian-mcp-server')
  await setMany(mcpId, [
    ['NODE_ENV', 'production'],
    ['MERIDIAN_MCP_TRANSPORT', 'http'],
    ['MERIDIAN_MCP_HOST', '0.0.0.0'],
    ['BACKEND_URL', urls['meridian-backend']],
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
    ['X402_FACILITATOR_URL', urls['meridian-x402-facilitator']],
    ['X402_RESOURCE_URL', urls['meridian-x402-resource']],
    ['LOG_LEVEL', env.LOG_LEVEL || 'info'],
  ])
}

for (const s of Object.values(services)) {
  if (s?.id) {
    try {
      await api('POST', `/services/${s.id}/deploys`, { clearCache: 'do_not_clear' })
    } catch {
      /* ignore */
    }
  }
}

console.log(
  JSON.stringify(
    {
      urls,
      ids: {
        backend: backendId,
        agents: agentsId,
        x402: x402Id,
        resource: resourceId,
        mcp: mcpId,
      },
    },
    null,
    2,
  ),
)
