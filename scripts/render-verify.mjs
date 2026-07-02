#!/usr/bin/env node
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

const AUTH = { Authorization: `Bearer ${RENDER_KEY}` }

const URLS = {
  backend: 'https://meridian-backend-ikx8.onrender.com',
  x402: 'https://meridian-x402-facilitator.onrender.com',
  resource: 'https://meridian-x402-resource.onrender.com',
  mcp: 'https://meridian-mcp-server-94q4.onrender.com',
}

const IDS = {
  backend: 'srv-d93aj1ernols73b8a170',
  agents: 'srv-d90sq5jeo5us73cau6vg',
  x402: 'srv-d90sq66q1p3s738jap8g',
  resource: 'srv-d90sq6ugvqtc739q7bq0',
  mcp: 'srv-d90sq73sq97s739mnm10',
}

async function deployStatus(serviceId) {
  const res = await fetch(`https://api.render.com/v1/services/${serviceId}/deploys?limit=1`, {
    headers: AUTH,
  })
  const rows = await res.json()
  const d = rows[0]?.deploy || rows[0]
  return d ? { status: d.status, id: d.id, finishedAt: d.finishedAt } : { status: 'unknown' }
}

async function waitDeploys(maxMin = 15) {
  const deadline = Date.now() + maxMin * 60_000
  while (Date.now() < deadline) {
    const statuses = {}
    for (const [name, id] of Object.entries(IDS)) {
      statuses[name] = await deployStatus(id)
    }
    console.log(JSON.stringify(statuses))
    const allLive = Object.values(statuses).every(
      (s) => s.status === 'live' || s.status === 'deactivated',
    )
    const anyFailed = Object.values(statuses).some((s) => s.status === 'build_failed' || s.status === 'update_failed')
    if (anyFailed) return statuses
    if (allLive) return statuses
    await new Promise((r) => setTimeout(r, 30_000))
  }
  return null
}

async function fetchCheck(label, url, opts = {}) {
  const started = Date.now()
  try {
    const res = await fetch(url, { ...opts, signal: AbortSignal.timeout(120_000) })
    const text = await res.text()
    return {
      label,
      url,
      ok: res.ok,
      status: res.status,
      ms: Date.now() - started,
      body: text.slice(0, 400),
    }
  } catch (e) {
    return { label, url, ok: false, status: 0, ms: Date.now() - started, error: String(e) }
  }
}

console.log('Waiting for Render deploys...')
const deploys = await waitDeploys(20)
console.log('Deploy status:', JSON.stringify(deploys, null, 2))

const apiKey = env.MERIDIAN_API_KEY || 'meridian-dev-api-key-change-in-production'
const checks = []

for (const [name, base] of Object.entries(URLS)) {
  checks.push(await fetchCheck(`${name} /health`, `${base}/health`))
  if (name === 'backend') {
    checks.push(await fetchCheck('backend /ready', `${base}/ready`))
    checks.push(await fetchCheck('backend /metrics', `${base}/metrics`))
    checks.push(await fetchCheck('backend OpenAPI', `${base}/docs/json`))
    checks.push(
      await fetchCheck('backend contracts', `${base}/api/v1/contracts`, {
        headers: { 'x-api-key': apiKey },
      }),
    )
  }
  if (name === 'x402') {
    checks.push(await fetchCheck('x402 /supported', `${base}/supported`))
  }
  if (name === 'mcp') {
    checks.push(await fetchCheck('mcp /metrics', `${base}/metrics`))
  }
}

console.log(JSON.stringify({ checks }, null, 2))
