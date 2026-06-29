#!/usr/bin/env node
/**
 * Phase 1 cloud connectivity verification.
 * Never logs secret values.
 */
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import dns from 'node:dns'
import { execSync } from 'node:child_process'
import pg from 'pg'
import { Redis } from '@upstash/redis'
import { loadEnvFile } from './load-env.mjs'
import { buildAiProviderChain, verifyAiProviderChain } from './ai-providers.mjs'

dns.setDefaultResultOrder('ipv4first')

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

function loadEnv() {
  return loadEnvFile(resolve(root, '.env'))
}

const results = []

function record(name, ok, detail) {
  results.push({ name, ok, detail })
  const tag = ok ? 'PASS' : 'FAIL'
  console.log(`${tag} | ${name} | ${detail}`)
}

async function verifySupabaseRest(env) {
  const base = env.SUPABASE_URL?.trim()
    .replace(/\/rest\/v1\/?$/, '')
    .replace(/\/$/, '')
  const anon = env.SUPABASE_ANON_KEY?.trim()
  if (!base || !anon) {
    record('supabase-rest', false, 'SUPABASE_URL or SUPABASE_ANON_KEY missing')
    return false
  }
  try {
    const res = await fetch(`${base}/rest/v1/`, {
      headers: { apikey: anon, Authorization: `Bearer ${anon}` },
    })
    const ok = res.status === 200 || res.status === 404 || res.status === 401
    record('supabase-rest', ok, `REST endpoint HTTP ${res.status}`)
    return ok
  } catch (err) {
    record('supabase-rest', false, err instanceof Error ? err.message : String(err))
    return false
  }
}

async function verifySupabase(env) {
  const url = env.DATABASE_URL?.trim()
  if (!url) {
    record('supabase-postgres', false, 'DATABASE_URL missing')
    await verifySupabaseRest(env)
    return
  }
  const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } })
  try {
    await client.connect()
    const res = await client.query('SELECT 1 AS ok')
    record('supabase-postgres', res.rows[0]?.ok === 1, 'SELECT 1 succeeded')
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    record('supabase-postgres', false, msg)
    if (msg.includes('ENETUNREACH') || msg.includes('EHOSTUNREACH')) {
      console.log(
        'WARN | supabase | Direct Postgres unreachable (IPv6/WSL) — verifying REST API fallback',
      )
      await verifySupabaseRest(env)
    }
  } finally {
    await client.end().catch(() => undefined)
  }
}

async function verifyUpstash(env) {
  const url = env.UPSTASH_REDIS_REST_URL?.trim()
  const token = env.UPSTASH_REDIS_REST_TOKEN?.trim()
  if (!url || !token) {
    record('upstash-redis', false, 'UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN missing')
    return
  }
  try {
    const redis = new Redis({ url, token })
    const pong = await redis.ping()
    record('upstash-redis', pong === 'PONG', `ping returned ${String(pong)}`)
  } catch (err) {
    record('upstash-redis', false, err instanceof Error ? err.message : String(err))
  }
}

async function verifyCasperRpc(env) {
  const rpc = env.CASPER_RPC_URL?.trim()
  const apiKey = env.CASPER_API_KEY?.trim()
  const expected = env.CASPER_CHAIN_NAME?.trim() || env.CASPER_NETWORK?.trim()
  if (!rpc) {
    record('casper-rpc', false, 'CASPER_RPC_URL missing')
    return
  }
  try {
    const headers = { 'Content-Type': 'application/json' }
    if (apiKey) headers['Authorization'] = apiKey
    const res = await fetch(rpc, {
      method: 'POST',
      headers,
      body: JSON.stringify({ id: 1, jsonrpc: '2.0', method: 'info_get_status', params: null }),
    })
    const body = await res.json()
    const chain = body?.result?.chainspec_name ?? body?.result?.api_status?.chainspec_name
    if (!res.ok || typeof chain !== 'string') {
      record('casper-rpc', false, `HTTP ${res.status}`)
      return
    }
    const chainMatch = !expected || chain === expected
    record(
      'casper-rpc',
      chainMatch,
      chainMatch
        ? `chainspec=${chain} matches ${expected}`
        : `chainspec=${chain} does not match ${expected}`,
    )
  } catch (err) {
    record('casper-rpc', false, err instanceof Error ? err.message : String(err))
  }
}

async function verifyCsprCloud(env) {
  const base = env.CASPER_SIDE_CAR_URL?.trim().replace(/\/$/, '')
  const apiKey = env.CASPER_API_KEY?.trim()
  if (!base || !apiKey) {
    record('cspr-cloud', false, 'CASPER_SIDE_CAR_URL or CASPER_API_KEY missing')
    return
  }
  const endpoints = [`${base}/health`, `${base}/accounts`]
  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, { headers: { Authorization: apiKey } })
      if (res.ok || res.status === 404) {
        record('cspr-cloud', true, `${endpoint} responded HTTP ${res.status}`)
        return
      }
    } catch {
      /* try next */
    }
  }
  record('cspr-cloud', false, 'no authenticated CSPR.cloud endpoint responded')
}

async function verifyOpenAi(env) {
  const key = env.OPENAI_API_KEY?.trim() || env.openai_api_key?.trim()
  const base = (env.OPENAI_BASE_URL?.trim() || 'https://zenmux.ai/api/v1').replace(/\/$/, '')
  const provider = env.AI_PROVIDER?.trim() || 'zenmux'
  const model = env.OPENAI_MODEL?.trim() || 'z-ai/glm-5.2-free'

  if (key) {
    try {
      const listRes = await fetch(`${base}/models`, {
        headers: { Authorization: `Bearer ${key}` },
      })
      if (listRes.ok) {
        const listBody = await listRes.json()
        const ids = Array.isArray(listBody?.data) ? listBody.data.map((m) => m.id) : []
        record('openai-models', true, `models endpoint OK (${provider} @ ${base})`)
        const listed = ids.includes(model)
        record(
          'openai-model-config',
          true,
          listed
            ? `${model} available on ZenMux`
            : `${model} not in ZenMux catalog (fallback chain active)`,
        )
      } else {
        record('openai-models', false, `HTTP ${listRes.status} listing models`)
      }
    } catch (err) {
      record('openai-models', false, err instanceof Error ? err.message : String(err))
    }
  } else {
    record('openai-models', false, 'ZenMux key missing')
  }

  const chain = buildAiProviderChain(env)
  if (chain.length === 0) {
    record('ai-chat', false, 'no AI providers configured')
    return
  }

  const result = await verifyAiProviderChain(env)
  if (result.ok && result.winner) {
    record(
      'ai-chat',
      true,
      `${result.winner.id} / ${result.winner.model} — ${result.attempts.at(-1)?.detail ?? 'chat OK'}`,
    )
    return
  }

  const summary = result.attempts.map((a) => `${a.provider}: ${a.detail ?? 'failed'}`).join('; ')
  record('ai-chat', false, summary || 'all providers failed')
}

function verifyToolchain() {
  const checks = [
    ['rustc', 'rustc --version'],
    ['cargo', 'cargo --version'],
    ['cargo-odra', 'cargo odra --version'],
    ['casper-client', 'casper-client --version'],
    ['node', 'node --version'],
    ['pnpm', 'pnpm --version'],
  ]
  for (const [name, cmd] of checks) {
    try {
      const out = execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
      record(`toolchain-${name}`, true, out.split('\n')[0] ?? 'ok')
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      record(`toolchain-${name}`, false, msg.split('\n')[0] ?? 'failed')
    }
  }
  record('verify-phase1-script', true, 'connectivity and toolchain checks complete')
}

async function main() {
  console.log('=== MERIDIAN verify-phase1.mjs ===')
  const env = loadEnv()

  // Trim trailing whitespace on SUPABASE_URL for validation warning only
  if (env.SUPABASE_URL?.endsWith(' ')) {
    console.log('WARN | env | SUPABASE_URL has trailing whitespace — trim in .env')
  }

  await verifySupabase(env)
  await verifyUpstash(env)
  await verifyCasperRpc(env)
  await verifyCsprCloud(env)
  await verifyOpenAi(env)
  verifyToolchain()

  const failed = results.filter((r) => !r.ok)

  console.log(`\nSummary: ${results.length - failed.length}/${results.length} passed`)
  if (failed.length > 0) {
    for (const f of failed) {
      console.log(`BLOCKER | ${f.name} | ${f.detail}`)
    }
  }

  process.exit(failed.length > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error('FATAL', err instanceof Error ? err.message : err)
  process.exit(1)
})
