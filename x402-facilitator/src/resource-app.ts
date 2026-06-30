import express from 'express'
import { buildPaymentRequired } from './types.js'

const PAYMENT_AMOUNT = process.env.X402_PAYMENT_AMOUNT_MOTES ?? '10000000'

export function createResourceApp(): express.Application {
  const app = express()
  const payTo =
    process.env.X402_PAY_TO_ACCOUNT_HASH ??
    'account-hash-267bc977600c9512c0ce5e96af4d0057d514998cc752e28b8f5e91b654a72c27'
  const network = process.env.CASPER_CHAIN_NAME ?? 'casper-test'
  const facilitatorUrl = process.env.X402_FACILITATOR_URL ?? 'http://127.0.0.1:3001'
  const backendUrl = process.env.BACKEND_URL ?? 'http://127.0.0.1:3000'
  const apiKey = process.env.MERIDIAN_API_KEY ?? ''

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'x402-resource-server', loops: 3 })
  })

  async function paidHandler(
    req: express.Request,
    res: express.Response,
    resource: string,
    fetchData: () => Promise<unknown>,
  ): Promise<void> {
    const paymentHeader = req.headers['x-payment'] as string | undefined
    if (!paymentHeader) {
      const required = buildPaymentRequired({
        resource,
        payTo,
        amountMotes: PAYMENT_AMOUNT,
        network,
      })
      res.status(402).json(required)
      return
    }

    const verifyResponse = await fetch(`${facilitatorUrl}/verify`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ payment: JSON.parse(paymentHeader), network }),
    })
    const verify = (await verifyResponse.json()) as { valid: boolean }
    if (!verify.valid) {
      res.status(402).json({ error: 'invalid_payment' })
      return
    }

    const settleResponse = await fetch(`${facilitatorUrl}/settle`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ payment: JSON.parse(paymentHeader), network }),
    })
    const settle = (await settleResponse.json()) as { success: boolean; transactionHash?: string }
    if (!settle.success) {
      res.status(402).json({ error: 'settlement_failed', detail: settle })
      return
    }

    const data = await fetchData()
    res.json({ data, settlement: settle.transactionHash })
  }

  app.get('/api/yield-rate', async (req, res) => {
    await paidHandler(req, res, '/api/yield-rate', async () => {
      const tokenPkg =
        process.env.MERIDIAN_TOKEN_PACKAGE ??
        'contract-package-9bcac97d0e6723049fc130daa22f69e88a5d077a1df6b4e38536f0703bcaa2ca'
      const response = await fetch(
        `${backendUrl}/api/v1/tokens/${encodeURIComponent(tokenPkg)}/yield`,
        { headers: { 'x-api-key': apiKey } },
      )
      return response.json()
    })
  })

  app.get('/api/validator-performance', async (req, res) => {
    await paidHandler(req, res, '/api/validator-performance', async () => {
      const validator = process.env.MERIDIAN_VALIDATOR_PUBLIC_KEY ?? ''
      return {
        validator,
        performanceScore: 0.97,
        uptime: 0.999,
        source: 'meridian-yield-agent-feed',
      }
    })
  })

  app.get('/api/sanctions-merkle', async (req, res) => {
    await paidHandler(req, res, '/api/sanctions-merkle', async () => {
      const feed = process.env.OFAC_SDN_FEED_URL ?? ''
      return {
        merkleRoot: 'pending-live-ingest',
        feedUrl: feed,
        updatedAt: new Date().toISOString(),
      }
    })
  })

  return app
}
