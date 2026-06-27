import { describe, expect, it } from 'vitest'
import { PolicyEngine } from '../../src/policy.js'

describe('PolicyEngine', () => {
  const payTo = 'account-hash-abc1234567890123456789012345678901234567890123456789012345678'

  it('rejects amounts above max', () => {
    const engine = new PolicyEngine(BigInt('10000000'), new Set([payTo]))
    expect(() => engine.validate(BigInt('20000000'), payTo)).toThrow()
  })

  it('accepts valid amount and payee', () => {
    const engine = new PolicyEngine(BigInt('100000000'), new Set([payTo]))
    expect(() => engine.validate(BigInt('5000000'), payTo)).not.toThrow()
  })
})
