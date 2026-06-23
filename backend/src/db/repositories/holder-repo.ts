import type { DbPool } from '../client.js'

export interface HolderRow {
  id: string
  account_hash: string
  country: number | null
  accredited: boolean
  sanctions_cleared: boolean
  status: string
  registered_at: Date | null
  revoked_at: Date | null
  revoke_reason: string | null
  created_at: Date
  updated_at: Date
}

export class HolderRepository {
  constructor(private readonly pool: DbPool) {}

  async upsertRegistered(
    accountHash: string,
    country?: number,
    accredited = false,
  ): Promise<void> {
    await this.pool.query(
      `INSERT INTO meridian_holders (account_hash, country, accredited, status, registered_at)
       VALUES ($1, $2, $3, 'registered', NOW())
       ON CONFLICT (account_hash) DO UPDATE SET
         country = COALESCE(EXCLUDED.country, meridian_holders.country),
         accredited = EXCLUDED.accredited,
         status = 'registered',
         registered_at = COALESCE(meridian_holders.registered_at, NOW()),
         updated_at = NOW()`,
      [accountHash, country ?? null, accredited],
    )
  }

  async markRevoked(accountHash: string, reason: string): Promise<void> {
    await this.pool.query(
      `UPDATE meridian_holders SET status = 'revoked', revoke_reason = $2,
              revoked_at = NOW(), updated_at = NOW()
       WHERE account_hash = $1`,
      [accountHash, reason],
    )
  }

  async findByAccount(accountHash: string): Promise<HolderRow | null> {
    const normalized = accountHash.replace(/^account-hash-/, '')
    const result = await this.pool.query<HolderRow>(
      `SELECT id::text, account_hash, country, accredited, sanctions_cleared,
              status, registered_at, revoked_at, revoke_reason, created_at, updated_at
       FROM meridian_holders
       WHERE account_hash = $1 OR account_hash = $2`,
      [accountHash, `account-hash-${normalized}`],
    )
    return result.rows[0] ?? null
  }

  async list(limit = 100): Promise<HolderRow[]> {
    const result = await this.pool.query<HolderRow>(
      `SELECT id::text, account_hash, country, accredited, sanctions_cleared,
              status, registered_at, revoked_at, revoke_reason, created_at, updated_at
       FROM meridian_holders ORDER BY updated_at DESC LIMIT $1`,
      [limit],
    )
    return result.rows
  }
}
