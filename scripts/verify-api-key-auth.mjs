#!/usr/bin/env node
/**
 * Verify MERIDIAN_API_KEY auth across production services (never prints the key).
 */
import { readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const env = { ...process.env }
if (existsSync(join(ROOT, '.env'))) {
  for (const line of readFileSync(join(ROOT, '.env'), 'utf8').split('\n')) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/)
    if (m && env[m[1]] === undefined) env[m[1]] = m[2]
  }
}

const API_KEY = env.MERIDIAN_API_KEY
const RENDER_KEY = env.render_api_key || env.RENDER_API_KEY || env.rebder_api_key
const BACKEND =
  env.BACKEND_URL_PRODUCTION || 'https://meridian-backend-ikx8.onrender.com'
const MCP = env.NEXT_PUBLIC_MCP_SERVER_URL || 'https://meridian-mcp-server-94q4.onrender.com'
const X402 = env.X402_FACILITATOR_URL || 'https://meridian-x402-facilitator.onrender.com'

if (!API_KEY) {
  console.error('MERIDIAN_API_KEY missing')
  process.exit(1)
}

let pass = 0
let fail = 0

function ok(label, detail = '') {
  pass++
  console.log(`PASS | ${label}${detail ? ` | ${detail}` : ''}`)
}

function bad(label, detail = '') {
  fail++
  console.error(`FAIL | ${label}${detail ? ` | ${detail}` : ''}`)
}

async function fetchStatus(url, headers = {}) {
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(120_000) })
  return { status: res.status, ok: res.ok }
}

// Backend auth
const noKey = await fetchStatus(`${BACKEND}/api/v1/tokens`)
if (noKey.status === 401) ok('backend rejects missing API key', `status=${noKey.status}`)
else bad('backend rejects missing API key', `status=${noKey.status}`)

const badKey = await fetchStatus(`${BACKEND}/api/v1/tokens`, {
  'x-api-key': 'invalid-key-on-purpose',
})
if (badKey.status === 401) ok('backend rejects invalid API key', `status=${badKey.status}`)
else bad('backend rejects invalid API key', `status=${badKey.status}`)

const goodKey = await fetchStatus(`${BACKEND}/api/v1/tokens`, { 'x-api-key': API_KEY })
if (goodKey.status === 200) ok('backend accepts valid API key', `status=${goodKey.status}`)
else bad('backend accepts valid API key', `status=${goodKey.status}`)

// Public health (no key)
const health = await fetchStatus(`${BACKEND}/health`)
if (health.status === 200) ok('backend /health public', `status=${health.status}`)
else bad('backend /health public', `status=${health.status}`)

// x402 + MCP liveness
const x402Health = await fetchStatus(`${X402}/health`)
if (x402Health.ok) ok('x402 /health', `status=${x402Health.status}`)
else bad('x402 /health', `status=${x402Health.status}`)

const mcpHealth = await fetchStatus(`${MCP}/health`)
if (mcpHealth.ok) ok('mcp /health', `status=${mcpHealth.status}`)
else bad('mcp /health', `status=${mcpHealth.status}`)

// Render env parity (length only — never print values)
if (RENDER_KEY) {
  const rows = await fetch('https://api.render.com/v1/services?limit=100', {
    headers: { Authorization: `Bearer ${RENDER_KEY}` },
  }).then((r) => r.json())

  for (const row of rows) {
    const s = row.service || row
    if (!s.name?.startsWith('meridian')) continue
    const envRows = await fetch(`https://api.render.com/v1/services/${s.id}/env-vars?limit=100`, {
      headers: { Authorization: `Bearer ${RENDER_KEY}` },
    }).then((r) => r.json())
    const map = {}
    for (const evRow of envRows) {
      const ev = evRow.envVar || evRow
      map[ev.key] = ev.value
    }
    const remote = map.MERIDIAN_API_KEY
    if (remote && remote.length === API_KEY.length && remote === API_KEY) {
      ok(`Render ${s.name} MERIDIAN_API_KEY synced`)
    } else if (!remote && s.suspended === 'suspended') {
      ok(`Render ${s.name} MERIDIAN_API_KEY skipped (suspended)`)
    } else {
      bad(`Render ${s.name} MERIDIAN_API_KEY synced`, remote ? 'mismatch' : 'missing')
    }
  }
}

console.log(JSON.stringify({ pass, fail, keyLength: API_KEY.length }))
process.exit(fail > 0 ? 1 : 0)
