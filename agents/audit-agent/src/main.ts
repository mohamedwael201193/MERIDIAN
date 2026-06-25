import { Redis } from '@upstash/redis'
import {
  AiClient,
  AgentCoordination,
  BackendClient,
  auditReviewSchema,
  auditSummarySchema,
  hashDecision,
  type YieldDecision,
} from '@meridian/agents-shared'

const REVIEW_SYSTEM = `You are MERIDIAN AuditAgent reviewing YieldAgent decisions.
Reject unsafe restake/undelegate actions. Respond with JSON only using exactly:
{"approved":boolean,"summary":string,"riskLevel":"low"|"medium"|"high"|"critical","rationale":string}`

const SUMMARY_SYSTEM = `You are MERIDIAN AuditAgent producing hourly audit summaries.
Respond with JSON only using exactly:
{"summary":string,"eventCount":number,"highlights":string[]}`

export class AuditAgent {
  private readonly ai: AiClient
  private readonly backend: BackendClient
  private readonly coordination: AgentCoordination

  constructor() {
    this.ai = new AiClient({ env: process.env })
    this.backend = new BackendClient({
      baseUrl: process.env.BACKEND_URL ?? 'http://127.0.0.1:3000',
      apiKey: process.env.MERIDIAN_API_KEY ?? '',
    })
    this.coordination = new AgentCoordination(
      new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL ?? '',
        token: process.env.UPSTASH_REDIS_REST_TOKEN ?? '',
      }),
    )
  }

  async reviewYieldDecision(
    decisionHash: string,
    decision: YieldDecision,
  ): Promise<{ approved: boolean; reviewHash: string }> {
    const review = await this.ai.structuredCompletion({
      system: REVIEW_SYSTEM,
      user: JSON.stringify({ decisionHash, decision }),
      schema: auditReviewSchema,
      label: 'audit_review',
    })

    await this.coordination.markReviewed(decisionHash, review.approved)

    const reviewHash = hashDecision('audit_review', { decisionHash, review })
    await fetch(`${process.env.BACKEND_URL ?? 'http://127.0.0.1:3000'}/api/v1/decisions`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': process.env.MERIDIAN_API_KEY ?? '',
      },
      body: JSON.stringify({
        agentName: 'audit',
        decisionHash: reviewHash,
        decisionType: 'yield_review',
        payload: { decisionHash, review },
        approved: review.approved,
        reviewedBy: 'audit-agent',
      }),
    })

    return { approved: review.approved, reviewHash }
  }

  async summarizeEvents(): Promise<{ summaryHash: string }> {
    const events = await this.backend.getEvents(100)
    const summary = await this.ai.structuredCompletion({
      system: SUMMARY_SYSTEM,
      user: JSON.stringify({ events: events.data }),
      schema: auditSummarySchema,
      label: 'audit_summary',
    })

    const summaryHash = hashDecision('audit_summary', summary)
    await fetch(`${process.env.BACKEND_URL ?? 'http://127.0.0.1:3000'}/api/v1/decisions`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': process.env.MERIDIAN_API_KEY ?? '',
      },
      body: JSON.stringify({
        agentName: 'audit',
        decisionHash: summaryHash,
        decisionType: 'hourly_summary',
        payload: summary,
        approved: true,
      }),
    })

    return { summaryHash }
  }
}

async function main(): Promise<void> {
  const agent = new AuditAgent()
  const coordination = new AgentCoordination(
    new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL ?? '',
      token: process.env.UPSTASH_REDIS_REST_TOKEN ?? '',
    }),
  )

  const sampleDecision = {
    action: 'restake' as const,
    validatorPublicKey: process.env.MERIDIAN_VALIDATOR_PUBLIC_KEY,
    amountMotes: '999999999999999999999',
    rationale: 'test adversarial oversized restake',
    confidence: 0.2,
  }
  const decisionHash = hashDecision('yield', sampleDecision)
  await coordination.setPendingReview(decisionHash, sampleDecision)

  const review = await agent.reviewYieldDecision(decisionHash, sampleDecision)
  const summary = await agent.summarizeEvents()
  console.log(JSON.stringify({ agent: 'audit', review, summary }))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
