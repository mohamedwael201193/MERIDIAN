#!/usr/bin/env node
/**
 * Downgrade meridian-backend to Render free tier (MERIDIAN services only).
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
const BACKEND_ID = 'srv-d90sq0bsq97s739mnin0'
const START = 'bash scripts/start-backend.sh'
const BUILD =
  'pnpm install --frozen-lockfile && pnpm --filter @meridian/env run build && pnpm --filter @meridian/casper-sdk run build && pnpm --filter @meridian/agents-shared run build && pnpm --filter @meridian/yield-agent run build && pnpm --filter @meridian/compliance-agent run build && pnpm --filter @meridian/audit-agent run build && pnpm --filter @meridian/backend run build'

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
  return { ok: res.ok, status: res.status, json, text }
}

async function getBackend() {
  const { json } = await api('GET', `/services/${BACKEND_ID}`)
  return json
}

async function main() {
  const before = await getBackend()
  console.log('Before:', {
    plan: before.serviceDetails?.plan,
    preDeploy: before.serviceDetails?.envSpecificDetails?.preDeployCommand,
    start: before.serviceDetails?.envSpecificDetails?.startCommand,
    suspended: before.suspended,
  })

  if (before.suspended === 'suspended') {
    console.log('Resuming meridian-backend...')
    await api('POST', `/services/${BACKEND_ID}/resume`)
    await new Promise((r) => setTimeout(r, 3000))
  }

  // Drop preDeploy by omitting it; set free plan + startup migrations.
  const patch = await api('PATCH', `/services/${BACKEND_ID}`, {
    serviceDetails: {
      plan: 'free',
      envSpecificDetails: {
        buildCommand: BUILD,
        startCommand: START,
      },
      healthCheckPath: '/health',
    },
  })
  console.log('PATCH plan=free:', patch.status, patch.text.slice(0, 200))

  if (!patch.ok) {
    console.log('Trying scale instanceType=free...')
    await api('POST', `/services/${BACKEND_ID}/scale`, {
      numInstances: 1,
      instanceType: 'free',
    })
    await new Promise((r) => setTimeout(r, 5000))
  }

  const after = await getBackend()
  console.log('After:', {
    plan: after.serviceDetails?.plan,
    preDeploy: after.serviceDetails?.envSpecificDetails?.preDeployCommand,
    start: after.serviceDetails?.envSpecificDetails?.startCommand,
    suspended: after.suspended,
  })

  console.log('Triggering deploy...')
  await api('POST', `/services/${BACKEND_ID}/deploys`, { clearCache: 'clear' })
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
