import type { DbPool } from '../client.js'

export interface AuditSummaryRow {
  id: string
  period_start: Date
  period_end: Date
  summary: string
  decision_hash: string
  transaction_hash: string | null
  agent_public_key: string | null
  event_count: number
  created_at: Date
}

export class AuditRepository {
  constructor(private readonly pool: DbPool) {}

  async insert(input: {
    periodStart: Date
    periodEnd: Date
    summary: string
    decisionHash: string
    transactionHash?: string
    agentPublicKey?: string
    eventCount: number
  }): Promise<void> {
    await this.pool.query(
      `INSERT INTO meridian_audit_summaries
        (period_start, period_end, summary, decision_hash, transaction_hash, agent_public_key, event_count)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (decision_hash) DO NOTHING`,
      [
        input.periodStart,
        input.periodEnd,
        input.summary,
        input.decisionHash,
        input.transactionHash ?? null,
        input.agentPublicKey ?? null,
        input.eventCount,
      ],
    )
  }

  async listRecent(limit: number): Promise<AuditSummaryRow[]> {
    const result = await this.pool.query<AuditSummaryRow>(
      `SELECT id::text, period_start, period_end, summary, decision_hash,
              transaction_hash, agent_public_key, event_count, created_at
       FROM meridian_audit_summaries
       ORDER BY period_end DESC LIMIT $1`,
      [limit],
    )
    return result.rows
  }
}
