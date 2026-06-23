import type { DbPool } from '../client.js'

export interface DistributionRow {
  id: string
  era_id: string
  block_height: string
  transaction_hash: string
  total_rewards: string
  protocol_fee: string
  distributed_at: Date
}

export class DistributionRepository {
  constructor(private readonly pool: DbPool) {}

  async insert(input: {
    eraId: number
    blockHeight: number
    transactionHash: string
    totalRewards: string
    protocolFee: string
  }): Promise<boolean> {
    const result = await this.pool.query(
      `INSERT INTO meridian_distributions
        (era_id, block_height, transaction_hash, total_rewards, protocol_fee)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (transaction_hash, era_id) DO NOTHING
       RETURNING id`,
      [
        input.eraId,
        input.blockHeight,
        input.transactionHash,
        input.totalRewards,
        input.protocolFee,
      ],
    )
    return (result.rowCount ?? 0) > 0
  }

  async listByEra(limit: number): Promise<DistributionRow[]> {
    const result = await this.pool.query<DistributionRow>(
      `SELECT id::text, era_id::text, block_height::text, transaction_hash,
              total_rewards::text, protocol_fee::text, distributed_at
       FROM meridian_distributions
       ORDER BY era_id DESC LIMIT $1`,
      [limit],
    )
    return result.rows
  }
}
