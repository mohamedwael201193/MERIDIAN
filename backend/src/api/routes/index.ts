import type { FastifyInstance } from 'fastify'
import type { AuditRepository } from '../../db/repositories/audit-repo.js'
import type { AgentDecisionRepository } from '../../db/repositories/agent-decision-repo.js'
import type { EventRepository } from '../../db/repositories/event-repo.js'
import type { HolderService, TokenService, YieldService } from '../../services/index.js'

export function registerApiRoutes(
  app: FastifyInstance,
  services: {
    tokens: TokenService
    holders: HolderService
    yields: YieldService
    events: EventRepository
    audit: AuditRepository
    decisions: AgentDecisionRepository
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

  app.post<{ Body: {
    agentName: string
    decisionHash: string
    decisionType: string
    payload: Record<string, unknown>
    approved?: boolean | null
    reviewedBy?: string | null
  } }>('/api/v1/decisions', async (request, reply) => {
    const body = request.body
    if (!body.agentName || !body.decisionHash || !body.decisionType || !body.payload) {
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
}
