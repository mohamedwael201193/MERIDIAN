import type { DbPool } from '../client.js'

export interface AgentDecisionRow {
  id: string
  agent_name: string
  decision_hash: string
  decision_type: string
  payload: Record<string, unknown>
  approved: boolean | null
  reviewed_by: string | null
  created_at: Date
}

export class AgentDecisionRepository {
  constructor(private readonly pool: DbPool) {}

  async insert(input: {
    agentName: string
    decisionHash: string
    decisionType: string
    payload: Record<string, unknown>
    approved?: boolean | null
    reviewedBy?: string | null
  }): Promise<void> {
    await this.pool.query(
      `INSERT INTO meridian_agent_decisions
        (agent_name, decision_hash, decision_type, payload, approved, reviewed_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (decision_hash) DO NOTHING`,
      [
        input.agentName,
        input.decisionHash,
        input.decisionType,
        JSON.stringify(input.payload),
        input.approved ?? null,
        input.reviewedBy ?? null,
      ],
    )
  }

  async listRecent(limit: number): Promise<AgentDecisionRow[]> {
    const result = await this.pool.query<AgentDecisionRow>(
      `SELECT id::text, agent_name, decision_hash, decision_type, payload,
              approved, reviewed_by, created_at
       FROM meridian_agent_decisions
       ORDER BY created_at DESC LIMIT $1`,
      [limit],
    )
    return result.rows
  }
}
