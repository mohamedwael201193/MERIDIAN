import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const ENV_PATH = join(ROOT, '.env')

const PEM_KEYS = [
  'MERIDIAN_DEPLOYER_PRIVATE_KEY_PEM',
  'MERIDIAN_YIELD_AGENT_PRIVATE_KEY_PEM',
  'MERIDIAN_COMPLIANCE_AGENT_PRIVATE_KEY_PEM',
  'MERIDIAN_AUDIT_AGENT_PRIVATE_KEY_PEM',
]

function parseEnv(content) {
  const map = new Map()
  for (const line of content.split('\n')) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/)
    if (m) map.set(m[1], m[2])
  }
  return map
}

function serializeEnv(lines, map) {
  const seen = new Set()
  const out = lines.map((line) => {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=/)
    if (!m) return line
    seen.add(m[1])
    if (map.has(m[1])) return `${m[1]}=${map.get(m[1])}`
    return line
  })
  for (const [key, value] of map) {
    if (!seen.has(key)) out.push(`${key}=${value}`)
  }
  return out.join('\n')
}

function toInlinePem(raw) {
  return raw.trim().replace(/\r?\n/g, '\\n')
}

function resolvePemValue(current) {
  if (current.includes('BEGIN')) return current
  if (existsSync(current)) return toInlinePem(readFileSync(current, 'utf8'))
  throw new Error(`pem_file_not_found:${current}`)
}

if (!existsSync(ENV_PATH)) {
  console.error('.env not found')
  process.exit(1)
}

const original = readFileSync(ENV_PATH, 'utf8')
const lines = original.split('\n')
const env = parseEnv(original)

for (const key of PEM_KEYS) {
  const current = env.get(key)
  if (!current) continue
  if (current.includes('BEGIN')) {
    console.log(`${key}: already inline`)
    continue
  }
  env.set(key, resolvePemValue(current))
  console.log(`${key}: inlined from file path`)
}

env.delete('ODRA_CASPER_LIVENET_SECRET_KEY_PATH')
const SKIP = new Set(['ODRA_CASPER_LIVENET_SECRET_KEY_PATH'])
const filtered = lines.filter((line) => {
  const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=/)
  return !(m && SKIP.has(m[1]))
})
writeFileSync(ENV_PATH, serializeEnv(filtered, env))
console.log('Removed ODRA_CASPER_LIVENET_SECRET_KEY_PATH from .env')
console.log('Done — PEM keys are now inline in .env')
