import { Registry, Counter, Gauge, Histogram, collectDefaultMetrics } from 'prom-client'

export const registry = new Registry()
collectDefaultMetrics({ register: registry })

export const eventsIndexedTotal = new Counter({
  name: 'meridian_events_indexed_total',
  help: 'Total contract events indexed',
  registers: [registry],
})

export const indexerLagBlocks = new Gauge({
  name: 'meridian_indexer_lag_blocks',
  help: 'Blocks behind chain tip',
  registers: [registry],
})

export const rpcErrorsTotal = new Counter({
  name: 'meridian_rpc_errors_total',
  help: 'RPC errors',
  labelNames: ['operation'],
  registers: [registry],
})

export const sidecarReconnectsTotal = new Counter({
  name: 'meridian_sidecar_reconnects_total',
  help: 'Streaming reconnect attempts',
  registers: [registry],
})

export const upstashErrorsTotal = new Counter({
  name: 'meridian_upstash_errors_total',
  help: 'Upstash Redis errors',
  registers: [registry],
})

export const supabaseQueryDuration = new Histogram({
  name: 'meridian_supabase_query_duration_ms',
  help: 'PostgreSQL query duration in ms',
  labelNames: ['operation'],
  buckets: [5, 10, 25, 50, 100, 250, 500, 1000],
  registers: [registry],
})

export const agentDecisionsTotal = new Counter({
  name: 'meridian_agent_decisions_total',
  help: 'Agent decisions recorded',
  labelNames: ['agent', 'outcome'],
  registers: [registry],
})

export const openaiRequestsTotal = new Counter({
  name: 'meridian_openai_requests_total',
  help: 'OpenAI API requests',
  labelNames: ['agent', 'status'],
  registers: [registry],
})

export async function metricsText(): Promise<string> {
  return registry.metrics()
}
