import {
  AiClient,
  BackendClient,
  complianceDecisionSchema,
  hashDecision,
  loadAgentWallet,
  postAgentDecision,
} from '@meridian/agents-shared'

const SYSTEM_PROMPT = `You are MERIDIAN ComplianceAgent. Respond with JSON only using exactly:
{"action":"allow"|"revoke"|"review","accountHash":string,"sanctionsMatch":boolean,"rationale":string,"confidence":number}`

export class ComplianceAgent {
  private readonly ai: AiClient
  private readonly backend: BackendClient
  private readonly wallet

  constructor() {
    this.wallet = loadAgentWallet('compliance')
    this.ai = new AiClient({ env: process.env })
    this.backend = new BackendClient({
      baseUrl: process.env.BACKEND_URL ?? 'http://127.0.0.1:3000',
      apiKey: process.env.MERIDIAN_API_KEY ?? '',
    })
  }

  async screenAccount(accountHash: string): Promise<{ decisionHash: string; decision: unknown }> {
    const compliance = await this.backend.getCompliance(accountHash)
    const raw = await this.ai.structuredCompletion({
      system: SYSTEM_PROMPT,
      user: JSON.stringify({ accountHash, compliance: compliance.data }),
      schema: complianceDecisionSchema,
      label: 'compliance_decision',
    })
    const decision = {
      ...raw,
      accountHash: raw.accountHash.length >= 10 ? raw.accountHash : accountHash,
    }

    const decisionHash = hashDecision('compliance', decision)

    await postAgentDecision({
      agentName: 'compliance',
      decisionHash,
      decisionType: 'compliance_screening',
      payload: decision,
    })

    return { decisionHash, decision }
  }
}

async function main(): Promise<void> {
  const agent = new ComplianceAgent()
  const account = process.env.MERIDIAN_COMPLIANCE_AGENT_ACCOUNT_HASH
  if (!account) {
    throw new Error('MERIDIAN_COMPLIANCE_AGENT_ACCOUNT_HASH required')
  }
  const result = await agent.screenAccount(account)
  console.log(JSON.stringify({ agent: 'compliance', ...result }))
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
