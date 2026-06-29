/**
 * Safe .env parser — handles multiline PEM values without shell execution.
 */
import { readFileSync, existsSync } from 'node:fs'

export function loadEnvFile(path) {
  if (!existsSync(path)) {
    throw new Error(`.env not found at ${path}`)
  }

  const env = {}
  const lines = readFileSync(path, 'utf8').split('\n')
  let currentKey = null
  let buffer = []

  const flush = () => {
    if (currentKey === null) return
    env[currentKey] = buffer.join('\n').trim()
    currentKey = null
    buffer = []
  }

  for (const rawLine of lines) {
    const line = rawLine.replace(/\r$/, '')
    if (!line.trim() || line.trim().startsWith('#')) {
      if (currentKey !== null) buffer.push(line)
      continue
    }

    const eq = line.indexOf('=')
    if (eq > 0 && currentKey === null) {
      const key = line.slice(0, eq).trim()
      const val = line.slice(eq + 1)
      if (val.includes('BEGIN') && !val.includes('END')) {
        currentKey = key
        buffer = [val]
      } else {
        env[key] = val.trim()
      }
      continue
    }

    if (currentKey !== null) {
      buffer.push(line)
      if (line.includes('END')) flush()
    }
  }

  flush()
  return env
}
