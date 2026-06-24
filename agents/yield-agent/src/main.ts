import { Redis } from '@upstash/redis'
import {
  AiClient,
  AgentCoordination,
  BackendClient,
  hashDecision,
  yieldDecisionSchema,
} from '@meridian/agents-shared'

const SYSTEM_PROMPT = `You are MERIDIAN YieldAgent. Respond with JSON only using exactly:
{"action":"restake"|"hold"|"undelegate","validatorPublicKey":string?,"amountMotes":string,"rationale":string,"confidence":number}
Never choose validators outside the provided whitelist.`

export class YieldAgent {
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

  async evaluateOnce(): Promise<{ decisionHash: string; approved: boolean | null }> {
    if (!(await this.coordination.rateLimit('yield', 60))) {
      throw new Error('yield_agent_rate_limited')
    }

    const tokens = await this.backend.getTokens()
    const vault = tokens.data.find(
      (t) => (t as { contract_name?: string }).contract_name === 'StakingVault',
    ) as { package_hash?: string } | undefined
    if (!vault?.package_hash) {
      throw new Error('staking_vault_not_found')
    }

    const yieldInfo = await this.backend.getYield(vault.package_hash)
    const whitelist = [process.env.MERIDIAN_VALIDATOR_PUBLIC_KEY].filter(Boolean)

    const decision = await this.ai.structuredCompletion({
      system: SYSTEM_PROMPT,
      user: JSON.stringify({ yieldInfo: yieldInfo.data, validatorWhitelist: whitelist }),
      schema: yieldDecisionSchema,
      label: 'yield_decision',
    })

    if (decision.action === 'restake' && decision.validatorPublicKey) {
      if (!whitelist.includes(decision.validatorPublicKey)) {
        throw new Error('validator_not_whitelisted')
      }
    }

    const decisionHash = hashDecision('yield', decision)
    await this.coordination.setPendingReview(decisionHash, decision)
    await this.coordination.publishDecision('yield', { decisionHash, decision })

    await fetch(`${process.env.BACKEND_URL ?? 'http://127.0.0.1:3000'}/api/v1/decisions`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': process.env.MERIDIAN_API_KEY ?? '',
      },
      body: JSON.stringify({
        agentName: 'yield',
        decisionHash,
        decisionType: 'yield_evaluation',
        payload: decision,
      }),
    })

    const approved = await this.coordination.isReviewApproved(decisionHash)
    return { decisionHash, approved }
  }
}

async function main(): Promise<void> {
  const agent = new YieldAgent()
  const result = await agent.evaluateOnce()
  console.log(JSON.stringify({ agent: 'yield', ...result }))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
