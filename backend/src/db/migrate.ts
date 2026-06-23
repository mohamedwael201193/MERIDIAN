import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'
import { loadBackendEnv } from '../config/env.js'
import { createLogger } from '../utils/logger.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

async function ensureMigrationsTable(client: pg.Client): Promise<void> {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      filename TEXT NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
}

async function listApplied(client: pg.Client): Promise<Set<string>> {
  const result = await client.query<{ filename: string }>(
    'SELECT filename FROM schema_migrations ORDER BY filename',
  )
  return new Set(result.rows.map((row) => row.filename))
}

async function main(): Promise<void> {
  const statusOnly = process.argv.includes('--status')
  const env = loadBackendEnv()
  const log = createLogger(env.LOG_LEVEL)
  const client = new pg.Client({ connectionString: env.DATABASE_URL })
  await client.connect()
  await ensureMigrationsTable(client)

  const migrationsDir = join(__dirname, 'migrations')
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort()

  const applied = await listApplied(client)

  if (statusOnly) {
    for (const file of files) {
      log.info({ file, applied: applied.has(file) }, 'migration_status')
    }
    await client.end()
    return
  }

  for (const file of files) {
    if (applied.has(file)) {
      log.info({ file }, 'migration_skip')
      continue
    }
    const sql = readFileSync(join(migrationsDir, file), 'utf8')
    log.info({ file }, 'migration_apply')
    await client.query('BEGIN')
    try {
      await client.query(sql)
      await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file])
      await client.query('COMMIT')
      log.info({ file }, 'migration_applied')
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    }
  }

  await client.end()
  log.info('migrations_complete')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
