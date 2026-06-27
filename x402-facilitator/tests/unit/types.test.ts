import { describe, expect, it } from 'vitest'
import { buildPaymentRequired, hashAuthorization, isWithinTimeWindow } from '../../src/types.js'

describe('x402 types', () => {
  it('builds payment required payload', () => {
    const req = buildPaymentRequired({
      resource: '/api/yield-rate',
      payTo: 'account-hash-abc',
      amountMotes: '10000000',
      network: 'casper-test',
    })
    expect(req.x402Version).toBe(1)
    expect(req.accepts[0]?.maxAmountRequired).toBe('10000000')
  })

  it('validates time window', () => {
    const now = Math.floor(Date.now() / 1000)
    expect(
      isWithinTimeWindow(
        {
          from: 'a',
          to: 'b',
          value: '1',
          validAfter: now - 10,
          validBefore: now + 10,
          nonce: 'n1',
        },
        now,
      ),
    ).toBe(true)
  })

  it('hashes authorization deterministically', () => {
    const auth = {
      from: 'account-hash-a',
      to: 'account-hash-b',
      value: '10000000',
      validAfter: 1,
      validBefore: 999,
      nonce: 'nonce-1',
    }
    const h1 = hashAuthorization(auth, 'casper-test:x402')
    const h2 = hashAuthorization(auth, 'casper-test:x402')
    expect(h1).toBe(h2)
  })
})
