import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { buildApp } from '../../src/app.js'

describe('backend integration', () => {
  let app: FastifyInstance
  let apiKey: string

  beforeAll(async () => {
    const built = await buildApp()
    app = built.app
    apiKey = built.env.MERIDIAN_API_KEY
  }, 120_000)

  afterAll(async () => {
    await app.close()
  })

  it('GET /health returns 200 when postgres and rpc are up', async () => {
    const response = await app.inject({ method: 'GET', url: '/health' })
    expect(response.statusCode).toBe(200)
    const body = response.json() as { checks: Record<string, { ok: boolean }> }
    expect(body.checks.postgres?.ok).toBe(true)
    expect(body.checks.rpc?.ok).toBe(true)
  })

  it('GET /metrics returns prometheus text', async () => {
    const response = await app.inject({ method: 'GET', url: '/metrics' })
    expect(response.statusCode).toBe(200)
    expect(response.headers['content-type']).toContain('text/plain')
    expect(response.body).toContain('meridian_events_indexed_total')
  })

  it('GET /api/v1/tokens requires API key', async () => {
    const unauthorized = await app.inject({ method: 'GET', url: '/api/v1/tokens' })
    expect(unauthorized.statusCode).toBe(401)
    const authorized = await app.inject({
      method: 'GET',
      url: '/api/v1/tokens',
      headers: { 'x-api-key': apiKey },
    })
    expect(authorized.statusCode).toBe(200)
    const body = authorized.json() as { data: unknown[] }
    expect(body.data.length).toBeGreaterThanOrEqual(5)
  })

  it('GET /api/v1/events returns indexed events', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/events?limit=5',
      headers: { 'x-api-key': apiKey },
    })
    expect(response.statusCode).toBe(200)
  })
})
