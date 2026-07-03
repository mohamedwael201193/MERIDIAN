import { resolve } from 'node:path'
import { Redis } from '@upstash/redis'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import { loadDeployedAddresses } from './config/contracts.js'
import { loadBackendEnv } from './config/env.js'
import { CasperRpcClient } from './casper/rpc-client.js'
import { CsprCloudRestClient } from './casper/cspr-cloud-rest.js'
import { createPool } from './db/client.js'
import { AuditRepository } from './db/repositories/audit-repo.js'
import { AgentDecisionRepository } from './db/repositories/agent-decision-repo.js'
import { CheckpointRepository } from './db/repositories/checkpoint-repo.js'
import { DistributionRepository } from './db/repositories/distribution-repo.js'
import { EventRepository } from './db/repositories/event-repo.js'
import { HolderRepository } from './db/repositories/holder-repo.js'
import { TokenRepository } from './db/repositories/token-repo.js'
import { runHealthChecks, runReadinessChecks } from './health/checks.js'
import { EventProcessor } from './indexer/event-processor.js'
import { SyncService } from './indexer/sync-service.js'
import { metricsText } from './metrics/prometheus.js'
import { HolderService, TokenService, YieldService } from './services/index.js'
import { createLogger } from './utils/logger.js'
import { registerApiRoutes } from './api/routes/index.js'
import { createApiKeyHook, registerErrorHandler } from './api/plugins/auth.js'

export async function buildApp() {
  const env = loadBackendEnv()
  const log = createLogger(env.LOG_LEVEL)
  const addressesPath = resolve(process.cwd(), env.MERIDIAN_CONTRACTS_PATH)
  const addresses = loadDeployedAddresses(addressesPath)

  const pool = createPool(env.DATABASE_URL, log)
  const rpc = new CasperRpcClient(env.CASPER_RPC_URL, env.CASPER_API_KEY)
  const csprCloud = new CsprCloudRestClient(env.CASPER_SIDE_CAR_URL, env.CASPER_API_KEY)
  const redis = new Redis({
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
  })

  const eventRepo = new EventRepository(pool)
  const tokenRepo = new TokenRepository(pool)
  const holderRepo = new HolderRepository(pool)
  const distributionRepo = new DistributionRepository(pool)
  const checkpointRepo = new CheckpointRepository(pool)
  const auditRepo = new AuditRepository(pool)
  const decisionRepo = new AgentDecisionRepository(pool)

  const processor = new EventProcessor(
    addresses,
    eventRepo,
    tokenRepo,
    holderRepo,
    distributionRepo,
    checkpointRepo,
    auditRepo,
    log,
  )

  let sync: SyncService | null = null
  if (env.INDEXER_ENABLED) {
    const streamingKey = process.env.CSPR_CLOUD_AUTH_TOKEN?.trim() || env.CASPER_API_KEY
    sync = new SyncService({
      addresses,
      processor,
      checkpoints: checkpointRepo,
      rpc,
      streamingBaseUrl: env.CSPR_STREAMING_URL,
      apiKey: streamingKey,
      log,
      backfillOnStart: env.INDEXER_BACKFILL_ON_START,
    })
  }

  const tokenService = new TokenService(tokenRepo)
  const holderService = new HolderService(holderRepo)
  const yieldService = new YieldService(tokenRepo, distributionRepo, eventRepo)

  const healthDeps = {
    pool,
    rpc,
    csprCloud,
    redis,
    sync,
    events: eventRepo,
  }

  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,
    },
    requestIdHeader: 'x-request-id',
    disableRequestLogging: env.NODE_ENV === 'production',
  })

  await app.register(cors, { origin: true })
  await app.register(helmet)
  await app.register(rateLimit, { max: 200, timeWindow: '1 minute' })
  await app.register(swagger, {
    openapi: {
      info: { title: 'MERIDIAN API', version: '1.0.0' },
      servers: [{ url: '/' }],
    },
  })
  await app.register(swaggerUi, { routePrefix: '/docs' })

  registerErrorHandler(app)

  app.get('/health', async (_request, reply) => {
    const report = await runHealthChecks(healthDeps)
    const criticalOk = report.checks.postgres?.ok && report.checks.rpc?.ok
    const code = criticalOk ? 200 : 503
    return reply.code(code).send(report)
  })

  app.get('/ready', async (_request, reply) => {
    const report = await runReadinessChecks(healthDeps)
    const code = report.status === 'ok' ? 200 : 503
    return reply.code(code).send(report)
  })

  app.get('/metrics', async (_request, reply) => {
    if (sync) {
      const lag = await sync.getLagBlocks()
      const { indexerLagBlocks } = await import('./metrics/prometheus.js')
      indexerLagBlocks.set(lag)
    }
    reply.header('Content-Type', 'text/plain; version=0.0.4')
    return metricsText()
  })

  app.addHook('onRequest', createApiKeyHook(env.MERIDIAN_API_KEY))
  registerApiRoutes(app, {
    tokens: tokenService,
    holders: holderService,
    yields: yieldService,
    events: eventRepo,
    audit: auditRepo,
    decisions: decisionRepo,
  })

  app.addHook('onClose', async () => {
    sync?.stop()
    await pool.end()
  })

  return { app, env, log, sync }
}
