#!/usr/bin/env node
/**
 * Production validation — 100 real x402 settlements with full metrics.
 */
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
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
const startedAt = Date.now()
const results = {
  event: 'x402_100_settlement_run',
  target: TARGET,
  startBalanceMotes: startBalance.toString(),
  startBalanceCspr: Number(startBalance) / 1e9,
  verifyOk: 0,
  settleOk: 0,
  settleFail: 0,
  retries: 0,
  transactionHashes: [],
  failures: [],
  durationsMs: [],
}

console.log(JSON.stringify({ event: 'start', ...results }))

for (let i = 0; i < TARGET; i += 1) {
  const t0 = Date.now()
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
  if (verify.valid) results.verifyOk += 1

  const settleRes = await fetch(`${base}/settle`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ payment, network }),
  })
  const settle = await settleRes.json()
  const elapsed = Date.now() - t0
  results.durationsMs.push(elapsed)

  if (settle.success && settle.transactionHash) {
    results.settleOk += 1
    results.transactionHashes.push(settle.transactionHash)
    if ((i + 1) % 10 === 0) {
      console.log(JSON.stringify({ progress: i + 1, settleOk: results.settleOk, lastTx: settle.transactionHash }))
    }
  } else {
    results.settleFail += 1
    results.failures.push({ index: i, reason: settle.reason ?? 'unknown' })
    if (settle.reason?.includes('nonce_replay')) results.retries += 1
  }
}

const endBalance = await balanceMotes()
results.endBalanceMotes = endBalance.toString()
results.endBalanceCspr = Number(endBalance) / 1e9
results.spentMotes = (startBalance - endBalance).toString()
results.spentCspr = Number(startBalance - endBalance) / 1e9
results.totalDurationMs = Date.now() - startedAt
results.avgSettleMs =
  results.durationsMs.length > 0
    ? Math.round(results.durationsMs.reduce((a, b) => a + b, 0) / results.durationsMs.length)
    : 0
results.successRate = `${((results.settleOk / TARGET) * 100).toFixed(1)}%`

const outPath = resolve(import.meta.dirname, '../../docs/reports/x402_100_settlement_results.json')
writeFileSync(outPath, JSON.stringify(results, null, 2))
console.log(JSON.stringify({ event: 'complete', settleOk: results.settleOk, successRate: results.successRate, outPath }))

process.exit(results.settleOk >= TARGET ? 0 : 1)
