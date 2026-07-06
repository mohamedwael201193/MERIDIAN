import type { FastifyInstance } from 'fastify'
import type { AuditRepository } from '../../db/repositories/audit-repo.js'
import type { AgentDecisionRepository } from '../../db/repositories/agent-decision-repo.js'
import type { AgentTraceRepository } from '../../db/repositories/agent-trace-repo.js'
import type { EventRepository } from '../../db/repositories/event-repo.js'
import type { HolderService, TokenService, YieldService } from '../../services/index.js'
import type { PlannerService } from '../../planner/planner-service.js'

export function registerApiRoutes(
  app: FastifyInstance,
  services: {
    tokens: TokenService
    holders: HolderService
    yields: YieldService
    events: EventRepository
    audit: AuditRepository
    decisions: AgentDecisionRepository
    traces: AgentTraceRepository
    planner: PlannerService
  },
): void {
  app.get('/api/v1/tokens', async () => {
    const tokens = await services.tokens.listTokens()
    return { data: tokens }
  })

  app.get<{ Params: { packageHash: string } }>(
    '/api/v1/tokens/:packageHash',
    async (request, reply) => {
      const token = await services.tokens.getToken(request.params.packageHash)
      if (!token) {
        return reply.code(404).send({
          error: { code: 'NOT_FOUND', message: 'Token not found' },
        })
      }
      return { data: token }
    },
  )

  app.get<{ Params: { packageHash: string } }>(
    '/api/v1/tokens/:packageHash/yield',
    async (request, reply) => {
      const yieldInfo = await services.yields.getCurrentYield(request.params.packageHash)
      if (!yieldInfo) {
        return reply.code(404).send({
          error: { code: 'NOT_FOUND', message: 'Token not found' },
        })
      }
      return { data: yieldInfo }
    },
  )

  app.get('/api/v1/yields/history', async (request) => {
    const limit = Number((request.query as { limit?: string }).limit ?? 50)
    const data = await services.yields.getHistory(Math.min(limit, 200))
    return { data }
  })

  app.get<{ Params: { accountHash: string } }>(
    '/api/v1/holders/:accountHash/compliance',
    async (request) => {
      const data = await services.holders.getCompliance(request.params.accountHash)
      return { data }
    },
  )

  app.get('/api/v1/holders', async (request) => {
    const limit = Number((request.query as { limit?: string }).limit ?? 100)
    const data = await services.holders.listHolders(Math.min(limit, 500))
    return { data }
  })

  app.get('/api/v1/events', async (request) => {
    const limit = Number((request.query as { limit?: string }).limit ?? 50)
    const data = await services.events.listRecent(Math.min(limit, 200))
    return { data }
  })

  app.get('/api/v1/audit/summaries', async (request) => {
    const limit = Number((request.query as { limit?: string }).limit ?? 20)
    const data = await services.audit.listRecent(Math.min(limit, 100))
    return { data }
  })

  app.get('/api/v1/decisions', async (request) => {
    const limit = Number((request.query as { limit?: string }).limit ?? 50)
    const data = await services.decisions.listRecent(Math.min(limit, 200))
    return { data }
  })

  app.post<{
    Body: {
      agentName: string
      decisionHash: string
      decisionType: string
      payload: Record<string, unknown>
      approved?: boolean | null
      reviewedBy?: string | null
    }
  }>('/api/v1/decisions', async (request, reply) => {
    const body = request.body
    if (!body.agentName || !body.decisionHash || !body.decisionType) {
      return reply.code(400).send({
        error: { code: 'INVALID_BODY', message: 'Missing required decision fields' },
      })
    }
    await services.decisions.insert({
      agentName: body.agentName,
      decisionHash: body.decisionHash,
      decisionType: body.decisionType,
      payload: body.payload,
      approved: body.approved ?? null,
      reviewedBy: body.reviewedBy ?? null,
    })
    return reply.code(201).send({ data: { decisionHash: body.decisionHash } })
  })

  app.get('/api/v1/traces', async (request) => {
    const query = request.query as { limit?: string; sessionId?: string }
    const limit = Number(query.limit ?? 100)
    const data = await services.traces.listRecent(Math.min(limit, 500), query.sessionId)
    return { data }
  })

  app.post<{
    Body: {
      sessionId: string
      stepType: string
      message: string
      agentName?: string
      payload?: Record<string, unknown>
    }
  }>('/api/v1/traces', async (request, reply) => {
    const body = request.body
    if (!body.sessionId || !body.stepType || !body.message) {
      return reply.code(400).send({
        error: { code: 'INVALID_BODY', message: 'sessionId, stepType, and message are required' },
      })
    }
    const row = await services.traces.insert({
      sessionId: body.sessionId,
      ...(body.agentName ? { agentName: body.agentName } : {}),
      stepType: body.stepType as never,
      message: body.message,
      ...(body.payload ? { payload: body.payload } : {}),
    })
    const { publishTrace } = await import('../../services/trace-broadcaster.js')
    publishTrace(row)
    return reply.code(201).send({ data: row })
  })

  app.get('/api/v1/traces/stream', async (request, reply) => {
    const query = request.query as { since?: string }
    const since = Number(query.since ?? 0)

    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    })

    const send = (event: string, data: unknown) => {
      reply.raw.write(`event: ${event}\n`)
      reply.raw.write(`data: ${JSON.stringify(data)}\n\n`)
    }

    const recent = await services.traces.listRecent(50)
    send('snapshot', { traces: recent })

    const { subscribeTraces } = await import('../../services/trace-broadcaster.js')
    const unsubscribe = subscribeTraces((trace) => {
      send('trace', trace)
    })

    const heartbeat = setInterval(() => {
      reply.raw.write(': heartbeat\n\n')
    }, 15_000)

    request.raw.on('close', () => {
      clearInterval(heartbeat)
      unsubscribe()
    })

    if (since > 0) {
      const missed = await services.traces.listSince(since)
      for (const trace of missed) {
        send('trace', trace)
      }
    }
  })

  app.post<{ Body: { objective: string; callerPublicKey?: string; sessionId?: string } }>(
    '/api/v1/planner/execute',
    async (request, reply) => {
      const body = request.body
      if (!body.objective.trim()) {
        return reply.code(400).send({
          error: { code: 'INVALID_BODY', message: 'objective is required' },
        })
      }
      try {
        const result = await services.planner.execute({
          objective: body.objective,
          ...(body.callerPublicKey ? { callerPublicKey: body.callerPublicKey } : {}),
          ...(body.sessionId ? { sessionId: body.sessionId } : {}),
        })
        return { data: result }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'planner_failed'
        return reply.code(422).send({ error: { code: 'PLANNER_FAILED', message } })
      }
    },
  )
}
