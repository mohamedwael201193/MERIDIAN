import { Redis } from '@upstash/redis'
import type { CasperRpcClient } from '../casper/rpc-client.js'
import type { CsprCloudRestClient } from '../casper/cspr-cloud-rest.js'
import type { DbPool } from '../db/client.js'
import type { EventRepository } from '../db/repositories/event-repo.js'
import type { SyncService } from '../indexer/sync-service.js'

export interface HealthReport {
  status: 'ok' | 'degraded' | 'error'
  checks: Record<string, { ok: boolean; detail?: string }>
  timestamp: string
}

export interface HealthDependencies {
  pool: DbPool
  rpc: CasperRpcClient
  csprCloud: CsprCloudRestClient
  redis: Redis
  sync: SyncService | null
  events: EventRepository
}

export async function runHealthChecks(deps: HealthDependencies): Promise<HealthReport> {
  const checks: HealthReport['checks'] = {}

  try {
    await deps.pool.query('SELECT 1')
    checks.postgres = { ok: true }
  } catch (error) {
    checks.postgres = { ok: false, detail: String(error) }
  }

  try {
    const status = await deps.rpc.getStatus()
    checks.rpc = { ok: true, detail: `height=${status.lastBlockHeight}` }
  } catch (error) {
    checks.rpc = { ok: false, detail: String(error) }
  }

  try {
    const ok = await deps.csprCloud.ping()
    checks.cspr_cloud = { ok, detail: ok ? 'reachable' : 'unreachable' }
  } catch (error) {
    checks.cspr_cloud = { ok: false, detail: String(error) }
  }

  try {
    await deps.redis.ping()
    checks.upstash = { ok: true }
  } catch (error) {
    checks.upstash = { ok: false, detail: String(error) }
  }

  if (deps.sync) {
    checks.indexer_stream = {
      ok: deps.sync.isStreamConnected(),
      detail: deps.sync.isStreamConnected() ? 'connected' : 'disconnected',
    }
    try {
      const lag = await deps.sync.getLagBlocks()
      checks.indexer_lag = { ok: lag < 500, detail: `${lag} blocks` }
    } catch (error) {
      checks.indexer_lag = { ok: false, detail: String(error) }
    }
  }

  const eventCount = await deps.events.count()
  checks.events_indexed = { ok: eventCount >= 0, detail: `${eventCount} events` }

  const values = Object.values(checks)
  const allOk = values.every((c) => c.ok)
  const someOk = values.some((c) => c.ok)

  return {
    status: allOk ? 'ok' : someOk ? 'degraded' : 'error',
    checks,
    timestamp: new Date().toISOString(),
  }
}

export async function runReadinessChecks(deps: HealthDependencies): Promise<HealthReport> {
  const health = await runHealthChecks(deps)
  const critical = ['postgres', 'rpc', 'upstash']
  const ready = critical.every((key) => health.checks[key]?.ok)
  return {
    ...health,
    status: ready ? 'ok' : 'error',
  }
}
