import type { AgentRole } from '@meridian/env'
import { loadAgentWallet, type AgentAttestation } from './agent-wallet.js'

export interface DecisionPostInput {
  agentName: AgentRole
  decisionHash: string
  decisionType: string
  payload: unknown
  approved?: boolean
  reviewedBy?: string
}

export async function postAgentDecision(input: DecisionPostInput): Promise<AgentAttestation> {
  const wallet = loadAgentWallet(input.agentName)
  const attestation = wallet.signAttestation({
    decisionHash: input.decisionHash,
    decisionType: input.decisionType,
    payload: input.payload,
  })

  const baseUrl = process.env.BACKEND_URL ?? 'http://127.0.0.1:3000'
  const res = await fetch(`${baseUrl}/api/v1/decisions`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': process.env.MERIDIAN_API_KEY ?? '',
    },
    body: JSON.stringify({
      agentName: input.agentName,
      decisionHash: input.decisionHash,
      decisionType: input.decisionType,
      payload: input.payload,
      approved: input.approved,
      reviewedBy: input.reviewedBy,
      attestation,
    }),
  })

  if (!res.ok) {
    throw new Error(`decision_post_failed:${String(res.status)}`)
  }

  return attestation
}
