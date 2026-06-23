import type { DbPool } from '../client.js'

export interface MeridianEventRow {
  id: string
  contract_name: string
  contract_package_hash: string
  contract_hash: string | null
  event_name: string
  event_data: Record<string, unknown>
  raw_data: string | null
  block_height: string
  event_id: string
  transform_id: string | null
  transaction_hash: string
  indexed_at: Date
}

export interface InsertEventInput {
  contractName: string
  contractPackageHash: string
  contractHash?: string | undefined
  eventName: string
  eventData: Record<string, unknown>
  rawData?: string | undefined
  blockHeight: number
  eventId: number
  transformId?: number | undefined
  transactionHash: string
}

export class EventRepository {
  constructor(private readonly pool: DbPool) {}

  async insertEvent(input: InsertEventInput): Promise<boolean> {
    const result = await this.pool.query(
      `INSERT INTO meridian_events (
        contract_name, contract_package_hash, contract_hash, event_name,
        event_data, raw_data, block_height, event_id, transform_id, transaction_hash
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      ON CONFLICT (block_height, event_id, contract_package_hash, event_name) DO NOTHING
      RETURNING id`,
      [
        input.contractName,
        input.contractPackageHash,
        input.contractHash ?? null,
        input.eventName,
        JSON.stringify(input.eventData),
        input.rawData ?? null,
        input.blockHeight,
        input.eventId,
        input.transformId ?? null,
        input.transactionHash,
      ],
    )
    return (result.rowCount ?? 0) > 0
  }

  async count(): Promise<number> {
    const result = await this.pool.query<{ count: string }>(
      'SELECT COUNT(*)::text AS count FROM meridian_events',
    )
    return Number(result.rows[0]?.count ?? 0)
  }

  async listRecent(limit: number): Promise<MeridianEventRow[]> {
    const result = await this.pool.query<MeridianEventRow>(
      `SELECT id::text, contract_name, contract_package_hash, contract_hash,
              event_name, event_data, raw_data, block_height::text, event_id::text,
              transform_id::text, transaction_hash, indexed_at
       FROM meridian_events
       ORDER BY block_height DESC, event_id DESC
       LIMIT $1`,
      [limit],
    )
    return result.rows
  }

  async listByName(eventName: string, limit: number): Promise<MeridianEventRow[]> {
    const result = await this.pool.query<MeridianEventRow>(
      `SELECT id::text, contract_name, contract_package_hash, contract_hash,
              event_name, event_data, raw_data, block_height::text, event_id::text,
              transform_id::text, transaction_hash, indexed_at
       FROM meridian_events
       WHERE event_name = $1
       ORDER BY block_height DESC
       LIMIT $2`,
      [eventName, limit],
    )
    return result.rows
  }
}
