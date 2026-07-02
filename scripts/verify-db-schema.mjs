#!/usr/bin/env node
/**
 * Verify schema_migrations and required MERIDIAN tables (no secret output).
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const env = {}

if (existsSync(join(ROOT, '.env'))) {
  for (const line of readFileSync(join(ROOT, '.env'), 'utf8').split('\n')) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/)
    if (m) env[m[1]] = m[2]
  }
}

const url = process.env.DATABASE_URL || env.DATABASE_URL
if (!url) {
  console.error('DATABASE_URL missing')
  process.exit(1)
}

const migrationFiles = readdirSync(join(ROOT, 'backend/src/db/migrations'))
  .filter((f) => f.endsWith('.sql'))
  .sort()

const requiredTables = [
  'schema_migrations',
  'meridian_tokens',
  'meridian_holders',
  'meridian_distributions',
  'meridian_events',
  'meridian_audit_summaries',
  'meridian_agent_decisions',
  'x402_payments',
]

let pass = 0
let fail = 0

function ok(label, detail = '') {
  pass++
  console.log(`PASS | ${label}${detail ? ` | ${detail}` : ''}`)
}

function bad(label, detail = '') {
  fail++
  console.error(`FAIL | ${label}${detail ? ` | ${detail}` : ''}`)
}

const client = new pg.Client({ connectionString: url })
await client.connect()

const applied = await client.query('SELECT filename FROM schema_migrations ORDER BY filename')
const appliedSet = new Set(applied.rows.map((r) => r.filename))

for (const file of migrationFiles) {
  if (appliedSet.has(file)) ok(`migration applied: ${file}`)
  else bad(`migration missing: ${file}`)
}

for (const table of requiredTables) {
  try {
    const r = await client.query(
      `SELECT COUNT(*)::int AS n FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1`,
      [table],
    )
    if (r.rows[0]?.n === 1) ok(`table exists: ${table}`)
    else bad(`table missing: ${table}`)
  } catch (e) {
    bad(`table check: ${table}`, e instanceof Error ? e.message : String(e))
  }
}

await client.end()
console.log(JSON.stringify({ pass, fail, migrations: migrationFiles.length, tables: requiredTables.length }))
process.exit(fail > 0 ? 1 : 0)
