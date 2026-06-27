#!/usr/bin/env node
/**
 * Phase 8 — x402 load test: verify always; settle while main purse has balance.
 */
import { createRequire } from 'node:module'
import { buildSignedPayment } from '../dist/facilitator-service.js'

const require = createRequire(import.meta.url)
const { HttpHandler, RpcClient, PrivateKey, KeyAlgorithm, PurseIdentifier } = require('casper-js-sdk')

const TARGET = Number(process.env.X402_LOAD_TARGET ?? 100)
const base = process.env.X402_FACILITATOR_URL ?? 'http://127.0.0.1:3001'
const network = process.env.CASPER_CHAIN_NAME ?? 'casper-test'
const amount = process.env.X402_PAYMENT_AMOUNT_MOTES ?? '2500000000'
const pemPath = process.env.ODRA_CASPER_LIVENET_SECRET_KEY_PATH ?? ''

async function balanceMotes() {
  const pem = require('node:fs').readFileSync(pemPath, 'utf8')
  const payer = PrivateKey.fromPem(pem, KeyAlgorithm.SECP256K1)
  const handler = new HttpHandler(process.env.CASPER_RPC_URL ?? '', 'fetch')
  if (process.env.CASPER_API_KEY) handler.setCustomHeaders({ Authorization: process.env.CASPER_API_KEY })
  const rpc = new RpcClient(handler)
  const bal = await rpc.queryLatestBalance(PurseIdentifier.fromPublicKey(payer.publicKey))
  return BigInt(bal.balance ?? '0')
}

const startBalance = await balanceMotes()
console.log(JSON.stringify({ event: 'x402_load_start', target: TARGET, startBalance: startBalance.toString() }))

let verifyOk = 0
let settleOk = 0
let settleFail = 0
const txHashes = []

for (let i = 0; i < TARGET; i += 1) {
  const payment = buildSignedPayment({
    payerPemPath: pemPath,
    payToAccountHash: process.env.X402_PAY_TO_ACCOUNT_HASH ?? '',
    amountMotes: amount,
    chainName: network,
  })
  delete payment.signedTransaction

  const verifyRes = await fetch(`${base}/verify`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ payment, network }),
  })
  const verify = await verifyRes.json()
  if (verify.valid) verifyOk += 1

  const settleRes = await fetch(`${base}/settle`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ payment, network }),
  })
  const settle = await settleRes.json()
  if (settle.success && settle.transactionHash) {
    settleOk += 1
    txHashes.push(settle.transactionHash)
  } else {
    settleFail += 1
    if (settle.reason?.includes('Invalid transaction') && settleOk === 0 && i > 2) {
      break
    }
  }
}

console.log(
  JSON.stringify({
    event: 'x402_load_complete',
    verifyOk,
    settleOk,
    settleFail,
    sampleTxHashes: txHashes.slice(0, 5),
  }),
)

process.exit(settleOk >= TARGET ? 0 : 1)
