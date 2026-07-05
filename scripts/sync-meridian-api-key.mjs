#!/usr/bin/env node
/**
 * Sync MERIDIAN_API_KEY to all meridian-* Render services (never logs the key).
 */
import { readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const fileEnv = {}
if (existsSync(join(ROOT, '.env'))) {
  for (const line of readFileSync(join(ROOT, '.env'), 'utf8').split('\n')) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/)
    if (m) fileEnv[m[1]] = m[2]
  }
}

const RENDER_KEY =
  process.env.RENDER_API_KEY ||
  process.env.render_api_key ||
  process.env.rebder_api_key ||
  fileEnv.RENDER_API_KEY ||
  fileEnv.render_api_key ||
  fileEnv.rebder_api_key

const API_KEY = process.env.MERIDIAN_API_KEY || fileEnv.MERIDIAN_API_KEY

if (!RENDER_KEY) {
  console.error('RENDER_API_KEY missing')
  process.exit(1)
}
if (!API_KEY || API_KEY.length < 64) {
  console.error('MERIDIAN_API_KEY missing or too short (expected 64-byte hex)')
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
  if (!res.ok) throw new Error(`${method} ${path} ${res.status}: ${text.slice(0, 300)}`)
  return text ? JSON.parse(text) : null
}

async function upsertEnvVar(serviceId, key, value) {
  await api('PUT', `/services/${serviceId}/env-vars/${encodeURIComponent(key)}`, { value })
}

const rows = await api('GET', '/services?limit=100')
const meridian = []
for (const row of rows) {
  const s = row.service || row
  if (s.name?.startsWith('meridian')) meridian.push(s)
}

console.log(
  'Updating MERIDIAN_API_KEY on:',
  meridian.map((s) => s.name).join(', '),
)

for (const svc of meridian) {
  await upsertEnvVar(svc.id, 'MERIDIAN_API_KEY', API_KEY)
  console.log(`  updated ${svc.name} (${svc.id})`)
}

const active = meridian.filter(
  (s) => s.suspended !== 'suspended' && s.name !== 'meridian-x402-resource',
)
for (const svc of active) {
  console.log(`  deploying ${svc.name}`)
  await api('POST', `/services/${svc.id}/deploys`, { clearCache: 'do_not_clear' })
}

console.log(JSON.stringify({ services: meridian.length, deployed: active.length, keyBytes: 64 }))
