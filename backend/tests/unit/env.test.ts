import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { loadBackendEnv } from '../../src/config/env.js'

describe('backend env', () => {
  it('loads required variables from root .env', () => {
    const envPath = resolve(process.cwd(), '../.env')
    const raw = readFileSync(envPath, 'utf8')
    const parsed: Record<string, string> = {}
    for (const line of raw.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const idx = trimmed.indexOf('=')
      if (idx === -1) continue
      parsed[trimmed.slice(0, idx)] = trimmed.slice(idx + 1)
    }
    const env = loadBackendEnv(parsed)
    expect(env.DATABASE_URL.startsWith('postgresql://')).toBe(true)
    expect(env.MERIDIAN_API_KEY.length).toBeGreaterThan(0)
    expect(env.CASPER_API_KEY.length).toBeGreaterThan(0)
  })
})
