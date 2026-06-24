import { createHash } from 'node:crypto'
import type { z } from 'zod'

export interface DecisionRecord {
  agent: string
  decisionHash: string
  payload: unknown
  createdAt: string
}

export function hashDecision(agent: string, payload: unknown): string {
  const canonical = JSON.stringify({ agent, payload, ts: Date.now() })
  return createHash('sha256').update(canonical).digest('hex')
}

export function validateOrThrow<T>(schema: z.ZodType<T>, raw: unknown, label: string): T {
  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    throw new Error(`${label}_schema_invalid:${parsed.error.message}`)
  }
  return parsed.data
}
