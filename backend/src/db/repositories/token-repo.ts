import type { DbPool } from '../client.js'

export interface TokenRow {
  id: string
  package_hash: string
  contract_name: string
  symbol: string | null
  total_supply: string
  total_staked: string
  created_at: Date
  updated_at: Date
}

export class TokenRepository {
  constructor(private readonly pool: DbPool) {}

  async upsertFromDeployment(
    packageHash: string,
    contractName: string,
    symbol?: string,
  ): Promise<void> {
    await this.pool.query(
      `INSERT INTO meridian_tokens (package_hash, contract_name, symbol)
       VALUES ($1, $2, $3)
       ON CONFLICT (package_hash) DO UPDATE SET
         contract_name = EXCLUDED.contract_name,
         symbol = COALESCE(EXCLUDED.symbol, meridian_tokens.symbol),
         updated_at = NOW()`,
      [packageHash, contractName, symbol ?? null],
    )
  }

  async updateStaked(packageHash: string, totalStaked: string): Promise<void> {
    await this.pool.query(
      `UPDATE meridian_tokens SET total_staked = $2, updated_at = NOW()
       WHERE package_hash = $1`,
      [packageHash, totalStaked],
    )
  }

  async updateSupply(packageHash: string, totalSupply: string): Promise<void> {
    await this.pool.query(
      `UPDATE meridian_tokens SET total_supply = $2, updated_at = NOW()
       WHERE package_hash = $1`,
      [packageHash, totalSupply],
    )
  }

  async list(): Promise<TokenRow[]> {
    const result = await this.pool.query<TokenRow>(
      `SELECT id::text, package_hash, contract_name, symbol,
              total_supply::text, total_staked::text, created_at, updated_at
       FROM meridian_tokens ORDER BY contract_name`,
    )
    return result.rows
  }

  async findByPackageHash(packageHash: string): Promise<TokenRow | null> {
    const result = await this.pool.query<TokenRow>(
      `SELECT id::text, package_hash, contract_name, symbol,
              total_supply::text, total_staked::text, created_at, updated_at
       FROM meridian_tokens WHERE package_hash = $1 OR package_hash = $2`,
      [packageHash, packageHash.replace(/^hash-/, 'contract-package-')],
    )
    return result.rows[0] ?? null
  }
}
