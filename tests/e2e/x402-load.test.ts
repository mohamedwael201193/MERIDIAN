import { describe, expect, it } from 'vitest'
import { buildSignedPayment, FacilitatorService } from '../../x402-facilitator/src/facilitator-service.js'
import { PolicyEngine, ReplayGuard } from '../../x402-facilitator/src/policy.js'
import { Redis } from '@upstash/redis'

const hasKey = Boolean(process.env.ODRA_CASPER_LIVENET_SECRET_KEY_PATH)
const payTo =
  process.env.X402_PAY_TO_ACCOUNT_HASH ??
  'account-hash-267bc977600c9512c0ce5e96af4d0057d514998cc752e28b8f5e91b654a72c27'

describe.skipIf(!hasKey)('x402 live settlement', () => {
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL ?? '',
    token: process.env.UPSTASH_REDIS_REST_TOKEN ?? '',
  })

  const service = new FacilitatorService(
    process.env.CASPER_RPC_URL ?? 'https://node.testnet.casper.network/rpc',
    process.env.CASPER_API_KEY,
    process.env.CASPER_CHAIN_NAME ?? 'casper-test',
    payTo,
    new ReplayGuard(redis),
    new PolicyEngine(BigInt('100000000000'), new Set([payTo])),
  )

  it('rejects replayed nonce', async () => {
    const payment = buildSignedPayment({
      payerPemPath: process.env.ODRA_CASPER_LIVENET_SECRET_KEY_PATH ?? '',
      payToAccountHash: payTo,
      amountMotes: '10000000',
      chainName: process.env.CASPER_CHAIN_NAME ?? 'casper-test',
    })
    const first = await service.verify(payment)
    expect(first.valid).toBe(true)
    await redis.set(`meridian:x402:nonce:${payment.authorization.nonce}`, '1', { ex: 60 })
    const second = await service.verify(payment)
    expect(second.valid).toBe(false)
    expect(second.reason).toBe('nonce_replay')
  })
})

describe.skipIf(!hasKey)('x402 load — 100 settlements', () => {
  it(
    'achieves 100 successful verify+settle cycles or documents purse limit',
    async () => {
      const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL ?? '',
        token: process.env.UPSTASH_REDIS_REST_TOKEN ?? '',
      })
      const service = new FacilitatorService(
        process.env.CASPER_RPC_URL ?? 'https://node.testnet.casper.network/rpc',
        process.env.CASPER_API_KEY,
        process.env.CASPER_CHAIN_NAME ?? 'casper-test',
        payTo,
        new ReplayGuard(redis),
        new PolicyEngine(BigInt('100000000000'), new Set([payTo])),
      )

      let verifyOk = 0
      let successes = 0
      let failures = 0
      const txHashes: string[] = []

      for (let i = 0; i < 100; i += 1) {
        const payment = buildSignedPayment({
          payerPemPath: process.env.ODRA_CASPER_LIVENET_SECRET_KEY_PATH ?? '',
          payToAccountHash: payTo,
          amountMotes: process.env.X402_PAYMENT_AMOUNT_MOTES ?? '2500000000',
          chainName: process.env.CASPER_CHAIN_NAME ?? 'casper-test',
        })
        delete payment.signedTransaction
        const verify = await service.verify(payment)
        if (verify.valid) verifyOk += 1
        const settle = await service.settle(payment)
        if (settle.success && settle.transactionHash) {
          successes += 1
          txHashes.push(settle.transactionHash)
        } else {
          failures += 1
          if (settle.reason?.includes('Invalid transaction') && successes === 0 && i > 5) {
            break
          }
        }
      }

      console.log(JSON.stringify({ verifyOk, successes, failures, sampleTx: txHashes[0] }))
      expect(verifyOk).toBeGreaterThan(0)
      expect(successes).toBeGreaterThanOrEqual(Math.min(100, verifyOk))
    },
    300_000,
  )
})
