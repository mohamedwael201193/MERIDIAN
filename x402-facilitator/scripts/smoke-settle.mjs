#!/usr/bin/env node
import { buildSignedPayment } from '../dist/facilitator-service.js'

const payment = buildSignedPayment({
  payerPem: process.env.MERIDIAN_DEPLOYER_PRIVATE_KEY_PEM ?? '',
  payToAccountHash: process.env.X402_PAY_TO_ACCOUNT_HASH ?? '',
  amountMotes: process.env.X402_PAYMENT_AMOUNT_MOTES ?? '10000000',
  chainName: process.env.CASPER_CHAIN_NAME ?? 'casper-test',
})

const base = process.env.X402_FACILITATOR_URL ?? 'http://127.0.0.1:3001'
const network = process.env.CASPER_CHAIN_NAME ?? 'casper-test'

const verifyRes = await fetch(`${base}/verify`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ payment, network }),
})
const verify = await verifyRes.json()
console.log(JSON.stringify({ step: 'verify', verify }))

const settleRes = await fetch(`${base}/settle`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ payment, network }),
})
const settle = await settleRes.json()
console.log(JSON.stringify({ step: 'settle', settle }))
