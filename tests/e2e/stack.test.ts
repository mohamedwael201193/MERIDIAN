import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { spawn, type ChildProcess } from 'node:child_process'
import { resolve } from 'node:path'

const ROOT = resolve(import.meta.dirname, '../..')

function wait(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

async function waitForHealth(url: string, attempts = 30): Promise<void> {
  for (let i = 0; i < attempts; i += 1) {
    try {
      const res = await fetch(url)
      if (res.ok) return
    } catch {
      /* retry */
    }
    await wait(1000)
  }
  throw new Error(`health_timeout:${url}`)
}

describe('Phase 8 E2E — stack connectivity', () => {
  let backend: ChildProcess | null = null
  let facilitator: ChildProcess | null = null
  let resource: ChildProcess | null = null

  beforeAll(async () => {
    const env = { ...process.env }
    backend = spawn('node', ['backend/dist/main.js'], { cwd: ROOT, env, stdio: 'ignore' })
    facilitator = spawn('node', ['x402-facilitator/dist/index.js'], {
      cwd: ROOT,
      env: { ...env, X402_MODE: 'facilitator' },
      stdio: 'ignore',
    })
    resource = spawn('node', ['x402-facilitator/dist/index.js'], {
      cwd: ROOT,
      env: { ...env, X402_MODE: 'resource' },
      stdio: 'ignore',
    })
    await waitForHealth(`${env.BACKEND_URL ?? 'http://127.0.0.1:3000'}/health`)
    await waitForHealth(`http://127.0.0.1:${env.X402_FACILITATOR_PORT ?? 3001}/health`)
    await waitForHealth(`http://127.0.0.1:${env.X402_RESOURCE_PORT ?? 3003}/health`)
  }, 120_000)

  afterAll(async () => {
    for (const proc of [resource, facilitator, backend]) {
      proc?.kill('SIGTERM')
    }
    await wait(500)
  })

  it('backend returns tokens from live index', async () => {
    const res = await fetch(`${process.env.BACKEND_URL}/api/v1/tokens`, {
      headers: { 'x-api-key': process.env.MERIDIAN_API_KEY ?? '' },
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as { data: unknown[] }
    expect(body.data.length).toBeGreaterThanOrEqual(5)
  })

  it('x402 resource returns 402 without payment', async () => {
    const res = await fetch(`http://127.0.0.1:${process.env.X402_RESOURCE_PORT ?? 3003}/api/yield-rate`)
    expect(res.status).toBe(402)
  })

  it('facilitator /supported returns casper-test', async () => {
    const res = await fetch(`http://127.0.0.1:${process.env.X402_FACILITATOR_PORT ?? 3001}/supported`)
    const body = (await res.json()) as { kinds: Array<{ network: string }> }
    expect(body.kinds[0]?.network).toBe('casper-test')
  })
})
