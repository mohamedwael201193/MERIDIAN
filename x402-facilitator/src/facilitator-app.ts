import express from 'express'
import rateLimit from 'express-rate-limit'
import { Registry, Counter, collectDefaultMetrics } from 'prom-client'
import { FacilitatorService } from './facilitator-service.js'
import { PolicyEngine, ReplayGuard } from './policy.js'
import { settleRequestSchema, verifyRequestSchema } from './types.js'
import { Redis } from '@upstash/redis'

export function createFacilitatorApp(service: FacilitatorService): express.Application {
  const app = express()
  app.use(express.json({ limit: '2mb' }))
  app.use(rateLimit({ windowMs: 60_000, max: 500 }))

  const registry = new Registry()
  collectDefaultMetrics({ register: registry })
  const verifyTotal = new Counter({
    name: 'meridian_x402_verify_total',
    help: 'x402 verify calls',
    labelNames: ['result'],
    registers: [registry],
  })
  const settleTotal = new Counter({
    name: 'meridian_x402_settle_total',
    help: 'x402 settle calls',
    labelNames: ['result'],
    registers: [registry],
  })

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'x402-facilitator' })
  })

  app.get('/metrics', async (_req, res) => {
    res.set('Content-Type', registry.contentType)
    res.send(await registry.metrics())
  })

  app.get('/supported', (_req, res) => {
    res.json(service.getSupported())
  })

  app.post('/verify', async (req, res) => {
    const body = verifyRequestSchema.parse(req.body)
    const result = await service.verify(body.payment)
    verifyTotal.inc({ result: result.valid ? 'ok' : 'fail' })
    res.json(result)
  })

  app.post('/settle', async (req, res) => {
    const body = settleRequestSchema.parse(req.body)
    const result = await service.settle(body.payment)
    settleTotal.inc({ result: result.success ? 'ok' : 'fail' })
    res.json(result)
  })

  app.use(
    (error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      if (error instanceof Error && error.name === 'ZodError') {
        res.status(400).json({ error: 'validation_failed', detail: error.message })
        return
      }
      res.status(500).json({
        error: 'internal_error',
        detail: error instanceof Error ? error.message : 'unknown',
      })
    },
  )

  return app
}

export function buildFacilitatorFromEnv(): express.Application {
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL ?? '',
    token: process.env.UPSTASH_REDIS_REST_TOKEN ?? '',
  })
  const payTo =
    process.env.X402_PAY_TO_ACCOUNT_HASH ??
    'account-hash-267bc977600c9512c0ce5e96af4d0057d514998cc752e28b8f5e91b654a72c27'

  const service = new FacilitatorService(
    process.env.CASPER_RPC_URL ?? 'https://node.testnet.casper.network/rpc',
    process.env.CASPER_API_KEY,
    process.env.CASPER_CHAIN_NAME ?? 'casper-test',
    payTo,
    new ReplayGuard(redis),
    new PolicyEngine(
      BigInt(process.env.X402_MAX_AMOUNT_MOTES ?? '100000000000'),
      new Set([payTo, payTo.replace(/^account-hash-/, '')]),
    ),
  )

  return createFacilitatorApp(service)
}
