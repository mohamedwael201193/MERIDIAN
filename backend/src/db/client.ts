import pg from 'pg'
import type { Logger } from '../utils/logger.js'

export type DbPool = pg.Pool

export function createPool(databaseUrl: string, log: Logger): DbPool {
  const pool = new pg.Pool({
    connectionString: databaseUrl,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  })

  pool.on('error', (error) => {
    log.error({ err: error }, 'postgres_pool_error')
  })

  return pool
}

export async function queryOne<T extends pg.QueryResultRow>(
  pool: DbPool,
  text: string,
  values?: unknown[],
): Promise<T | null> {
  const result = await pool.query<T>(text, values)
  return result.rows[0] ?? null
}

export async function queryMany<T extends pg.QueryResultRow>(
  pool: DbPool,
  text: string,
  values?: unknown[],
): Promise<T[]> {
  const result = await pool.query<T>(text, values)
  return result.rows
}
