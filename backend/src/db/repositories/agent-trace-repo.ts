import type { DbPool } from '../client.js'

export type TraceStepType =
  | 'objective_received'
  | 'reasoning'
  | 'tool_discovery'
  | 'tool_selected'
  | 'tool_invoked'
  | 'wallet_required'
  | 'wallet_signed'
  | 'deploy_broadcast'
  | 'finality'
  | 'indexer_updated'
  | 'planner_result'
  | 'read_result'
  | 'decision_recorded'
  | 'x402_payment'
  | 'error'
  | 'complete'

export interface AgentTraceRow {
  id: string
  session_id: string
  agent_name: string
  step_type: TraceStepType
  message: string
  payload: Record<string, unknown>
  created_at: Date
}

export class AgentTraceRepository {
  constructor(private readonly pool: DbPool) {}

  async insert(input: {
    sessionId: string
    agentName?: string
    stepType: TraceStepType
    message: string
    payload?: Record<string, unknown>
  }): Promise<AgentTraceRow> {
    const result = await this.pool.query<AgentTraceRow>(
      `INSERT INTO meridian_agent_traces (session_id, agent_name, step_type, message, payload)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id::text, session_id, agent_name, step_type, message, payload, created_at`,
      [
        input.sessionId,
        input.agentName ?? 'planner',
        input.stepType,
        input.message,
        JSON.stringify(input.payload ?? {}),
      ],
    )
    const row = result.rows[0]
    if (!row) throw new Error('trace_insert_failed')
    return row
  }

  async listRecent(limit: number, sessionId?: string): Promise<AgentTraceRow[]> {
    if (sessionId) {
      const result = await this.pool.query<AgentTraceRow>(
        `SELECT id::text, session_id, agent_name, step_type, message, payload, created_at
         FROM meridian_agent_traces
         WHERE session_id = $1
         ORDER BY created_at ASC
         LIMIT $2`,
        [sessionId, limit],
      )
      return result.rows
    }

    const result = await this.pool.query<AgentTraceRow>(
      `SELECT id::text, session_id, agent_name, step_type, message, payload, created_at
       FROM meridian_agent_traces
       ORDER BY created_at DESC
       LIMIT $1`,
      [limit],
    )
    return result.rows.reverse()
  }

  async listSince(id: number, limit = 100): Promise<AgentTraceRow[]> {
    const result = await this.pool.query<AgentTraceRow>(
      `SELECT id::text, session_id, agent_name, step_type, message, payload, created_at
       FROM meridian_agent_traces
       WHERE id > $1
       ORDER BY id ASC
       LIMIT $2`,
      [id, limit],
    )
    return result.rows
  }
}
