import type { DbPool } from '../client.js'

export interface CheckpointRow {
  last_block_height: string
  last_event_id: string
  last_backfill_tx: string | null
  updated_at: Date
}

export class CheckpointRepository {
  constructor(private readonly pool: DbPool) {}

  async get(): Promise<CheckpointRow> {
    const result = await this.pool.query<CheckpointRow>(
      `SELECT last_block_height::text, last_event_id::text, last_backfill_tx, updated_at
       FROM indexer_checkpoints WHERE id = 1`,
    )
    const row = result.rows[0]
    if (!row) {
      throw new Error('indexer checkpoint row missing')
    }
    return row
  }

  async update(blockHeight: number, eventId: number, backfillTx?: string): Promise<void> {
    await this.pool.query(
      `UPDATE indexer_checkpoints SET
         last_block_height = GREATEST(last_block_height, $1),
         last_event_id = GREATEST(last_event_id, $2),
         last_backfill_tx = COALESCE($3, last_backfill_tx),
         updated_at = NOW()
       WHERE id = 1`,
      [blockHeight, eventId, backfillTx ?? null],
    )
  }
}
