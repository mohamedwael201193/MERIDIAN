#!/usr/bin/env node
/**
 * Recreate meridian-backend on Render free tier (no preDeployCommand).
 * ONLY touches the meridian-backend service.
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

const RENDER_KEY =
  process.env.RENDER_API_KEY ||
  process.env.rebder_api_key ||
  env.RENDER_API_KEY ||
  env.rebder_api_key
if (!RENDER_KEY) {
  console.error('RENDER_API_KEY missing')
  process.exit(1)
}

const AUTH = { Authorization: `Bearer ${RENDER_KEY}`, 'Content-Type': 'application/json' }
const OWNER_ID = 'tea-d80krqjeo5us73fkgsu0'
const REPO = 'https://github.com/mohamedwael201193/MERIDIAN'
const BACKEND_NAME = 'meridian-backend'
const OLD_BACKEND_ID = 'srv-d90sq0bsq97s739mnin0'

const BACKEND_BUILD =
  'pnpm install --frozen-lockfile && pnpm --filter @meridian/env run build && pnpm --filter @meridian/casper-sdk run build && pnpm --filter @meridian/agents-shared run build && pnpm --filter @meridian/yield-agent run build && pnpm --filter @meridian/compliance-agent run build && pnpm --filter @meridian/audit-agent run build && pnpm --filter @meridian/backend run build'
const BACKEND_START = 'bash scripts/start-backend.sh'

function resolveEnvPem(key) {
  const value = env[key]
  if (!value) return ''
  if (value.includes('BEGIN')) return value.replace(/\\n/g, '\n')
  return ''
}

async function api(method, path, body) {
  const res = await fetch(`https://api.render.com/v1${path}`, {
    method,
    headers: AUTH,
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  let json = null
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

async function getEnvVars(serviceId) {
  const rows = await api('GET', `/services/${serviceId}/env-vars?limit=100`)
  const out = {}
  for (const row of rows) {
    const ev = row.envVar || row
    out[ev.key] = ev.value
  }
  return out
}

async function setEnv(serviceId, pairs) {
  const body = pairs
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([key, value]) => ({ key, value: String(value) }))
  if (body.length === 0) return
  await api('PUT', `/services/${serviceId}/env-vars`, body)
}

const yieldPem = resolveEnvPem('MERIDIAN_YIELD_AGENT_PRIVATE_KEY_PEM')
const compliancePem = resolveEnvPem('MERIDIAN_COMPLIANCE_AGENT_PRIVATE_KEY_PEM')
const auditPem = resolveEnvPem('MERIDIAN_AUDIT_AGENT_PRIVATE_KEY_PEM')

const services = await listMeridianServices()
const backend = services[BACKEND_NAME]
if (!backend?.id) throw new Error(`${BACKEND_NAME} not found`)
if (backend.id !== OLD_BACKEND_ID) {
  console.warn(`Backend id changed (${backend.id}); continuing with listed service`)
}

console.log('Current backend:', {
  id: backend.id,
  plan: backend.serviceDetails?.plan,
  preDeploy: backend.serviceDetails?.envSpecificDetails?.preDeployCommand,
  url: backend.serviceDetails?.url,
})

const savedEnv = await getEnvVars(backend.id)
console.log(`Saved ${Object.keys(savedEnv).length} env vars`)

console.log(`Deleting ${BACKEND_NAME} (${backend.id})...`)
await api('DELETE', `/services/${backend.id}`)

console.log('Creating free meridian-backend (no preDeploy)...')
const created = await api('POST', '/services', {
  type: 'web_service',
  name: BACKEND_NAME,
  ownerId: OWNER_ID,
  repo: REPO,
  branch: 'main',
  region: 'frankfurt',
  plan: 'free',
  autoDeploy: 'yes',
  serviceDetails: {
    env: 'node',
    envSpecificDetails: {
      buildCommand: BACKEND_BUILD,
      startCommand: BACKEND_START,
    },
    healthCheckPath: '/health',
  },
})

const svc = created.service || created
const newId = svc.id
const newUrl = svc.serviceDetails?.url || svc.url
console.log('Created:', {
  id: newId,
  url: newUrl,
  plan: svc.serviceDetails?.plan,
  preDeploy: svc.serviceDetails?.envSpecificDetails?.preDeployCommand,
})

const x402Url =
  services['meridian-x402']?.serviceDetails?.url ||
  services['meridian-x402-facilitator']?.serviceDetails?.url ||
  env.X402_FACILITATOR_URL ||
  'https://meridian-x402-facilitator.onrender.com'

await setEnv(newId, [
  ['NODE_ENV', 'production'],
  ['HOST', '0.0.0.0'],
  ['AGENTS_ENABLED', 'true'],
  ['AGENT_INTERVAL_MS', '300000'],
  ['DATABASE_URL', env.DATABASE_URL || savedEnv.DATABASE_URL],
  ['SUPABASE_URL', env.SUPABASE_URL || savedEnv.SUPABASE_URL],
  ['SUPABASE_ANON_KEY', env.SUPABASE_ANON_KEY || savedEnv.SUPABASE_ANON_KEY],
  ['SUPABASE_SERVICE_ROLE_KEY', env.SUPABASE_SERVICE_ROLE_KEY || savedEnv.SUPABASE_SERVICE_ROLE_KEY],
  ['UPSTASH_REDIS_REST_URL', env.UPSTASH_REDIS_REST_URL || savedEnv.UPSTASH_REDIS_REST_URL],
  ['UPSTASH_REDIS_REST_TOKEN', env.UPSTASH_REDIS_REST_TOKEN || savedEnv.UPSTASH_REDIS_REST_TOKEN],
  ['CASPER_NETWORK', env.CASPER_NETWORK || savedEnv.CASPER_NETWORK || 'casper-test'],
  ['CASPER_RPC_URL', env.CASPER_RPC_URL || savedEnv.CASPER_RPC_URL],
  ['CASPER_CHAIN_NAME', env.CASPER_CHAIN_NAME || savedEnv.CASPER_CHAIN_NAME || 'casper-test'],
  ['CASPER_API_KEY', env.CASPER_API_KEY || savedEnv.CASPER_API_KEY],
  ['CASPER_SIDE_CAR_URL', env.CASPER_SIDE_CAR_URL || savedEnv.CASPER_SIDE_CAR_URL],
  ['CSPR_STREAMING_URL', env.CSPR_STREAMING_URL || savedEnv.CSPR_STREAMING_URL],
  ['CSPR_CLOUD_AUTH_TOKEN', env.CSPR_CLOUD_AUTH_TOKEN || savedEnv.CSPR_CLOUD_AUTH_TOKEN],
  ['MERIDIAN_API_KEY', env.MERIDIAN_API_KEY || savedEnv.MERIDIAN_API_KEY],
  ['MERIDIAN_CONTRACTS_PATH', 'deployed/addresses.json'],
  ['MERIDIAN_VALIDATOR_PUBLIC_KEY', env.MERIDIAN_VALIDATOR_PUBLIC_KEY || savedEnv.MERIDIAN_VALIDATOR_PUBLIC_KEY],
  ['MERIDIAN_YIELD_AGENT_PUBLIC_KEY', env.MERIDIAN_YIELD_AGENT_PUBLIC_KEY || savedEnv.MERIDIAN_YIELD_AGENT_PUBLIC_KEY],
  ['MERIDIAN_YIELD_AGENT_ACCOUNT_HASH', env.MERIDIAN_YIELD_AGENT_ACCOUNT_HASH || savedEnv.MERIDIAN_YIELD_AGENT_ACCOUNT_HASH],
  ['MERIDIAN_YIELD_AGENT_PRIVATE_KEY_PEM', yieldPem || savedEnv.MERIDIAN_YIELD_AGENT_PRIVATE_KEY_PEM],
  ['MERIDIAN_COMPLIANCE_AGENT_PUBLIC_KEY', env.MERIDIAN_COMPLIANCE_AGENT_PUBLIC_KEY || savedEnv.MERIDIAN_COMPLIANCE_AGENT_PUBLIC_KEY],
  ['MERIDIAN_COMPLIANCE_AGENT_ACCOUNT_HASH', env.MERIDIAN_COMPLIANCE_AGENT_ACCOUNT_HASH || savedEnv.MERIDIAN_COMPLIANCE_AGENT_ACCOUNT_HASH],
  ['MERIDIAN_COMPLIANCE_AGENT_PRIVATE_KEY_PEM', compliancePem || savedEnv.MERIDIAN_COMPLIANCE_AGENT_PRIVATE_KEY_PEM],
  ['MERIDIAN_AUDIT_AGENT_PUBLIC_KEY', env.MERIDIAN_AUDIT_AGENT_PUBLIC_KEY || savedEnv.MERIDIAN_AUDIT_AGENT_PUBLIC_KEY],
  ['MERIDIAN_AUDIT_AGENT_ACCOUNT_HASH', env.MERIDIAN_AUDIT_AGENT_ACCOUNT_HASH || savedEnv.MERIDIAN_AUDIT_AGENT_ACCOUNT_HASH],
  ['MERIDIAN_AUDIT_AGENT_PRIVATE_KEY_PEM', auditPem || savedEnv.MERIDIAN_AUDIT_AGENT_PRIVATE_KEY_PEM],
  ['INDEXER_ENABLED', 'true'],
  ['INDEXER_BACKFILL_ON_START', 'true'],
  ['LOG_LEVEL', env.LOG_LEVEL || savedEnv.LOG_LEVEL || 'info'],
  ['OPENAI_API_KEY', env.OPENAI_API_KEY || savedEnv.OPENAI_API_KEY],
  ['OPENAI_BASE_URL', env.OPENAI_BASE_URL || savedEnv.OPENAI_BASE_URL],
  ['OPENAI_MODEL', env.OPENAI_MODEL || savedEnv.OPENAI_MODEL],
  ['CEREBRAS_API_KEY', env.CEREBRAS_API_KEY || savedEnv.CEREBRAS_API_KEY],
  ['SAMBANOVA_API_KEY', env.SAMBANOVA_API_KEY || savedEnv.SAMBANOVA_API_KEY],
  ['TOGETHER_API_KEY', env.TOGETHER_API_KEY || savedEnv.TOGETHER_API_KEY],
  ['OPENROUTER_API_KEY', env.OPENROUTER_API_KEY || savedEnv.OPENROUTER_API_KEY],
  ['GROQ_API_KEY', env.GROQ_API_KEY || savedEnv.GROQ_API_KEY],
  ['GEMINI_API_KEY', env.GEMINI_API_KEY || savedEnv.GEMINI_API_KEY],
  ['BACKEND_URL', newUrl],
  ['X402_FACILITATOR_URL', x402Url],
])

for (const name of ['meridian-x402', 'meridian-x402-facilitator', 'meridian-mcp-server']) {
  const svc = services[name]
  if (!svc?.id) continue
  console.log(`Updating BACKEND_URL on ${name}`)
  await setEnv(svc.id, [
    ['BACKEND_URL', newUrl],
    ['MERIDIAN_API_KEY', env.MERIDIAN_API_KEY || savedEnv.MERIDIAN_API_KEY],
  ])
}

console.log('Triggering backend deploy...')
await api('POST', `/services/${newId}/deploys`, { clearCache: 'clear' })

console.log(JSON.stringify({ backendId: newId, backendUrl: newUrl }, null, 2))
