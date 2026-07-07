#!/usr/bin/env node
/**
 * MERIDIAN execution audit — tests planner write/read flows against live backend.
 * Usage: node scripts/execution-audit.mjs [backendUrl]
 */
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

function loadEnv() {
  try {
    const raw = readFileSync(resolve(root, '.env'), 'utf8')
    const env = {}
    for (const line of raw.split('\n')) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
      if (m) env[m[1]] = m[2].trim()
    }
    return env
  } catch {
    return {}
  }
}

const env = loadEnv()
const BACKEND =
  process.argv[2] ??
  env.BACKEND_URL_PRODUCTION ??
  env.NEXT_PUBLIC_BACKEND_URL ??
  'https://meridian-backend-ikx8.onrender.com'
const API_KEY = env.MERIDIAN_API_KEY ?? ''
const PK = '020257c5a3d8b76c0c5c8a4d12d6100f201e334dc1fbf53a10bccdc8769c59d969fd'
const ACCOUNT_HASH = 'account-hash-d73864646338c6fef8649847103f8c7c6fd877433866bc059acd95a0548cc216'

const COMMANDS = [
  { name: 'Check Yield', objective: 'What is the current MRWA yield APY?', expectWrite: false },
  { name: 'Compliance audit', objective: 'Run compliance audit on my wallet', expectWrite: false },
  {
    name: 'Delegate 500 CSPR',
    objective: 'Delegate stake 500 CSPR',
    expectWrite: true,
    writeTool: 'delegate_stake',
  },
  {
    name: 'Vault Deposit',
    objective: 'Vault deposit 10 CSPR',
    expectWrite: true,
    writeTool: 'deposit_to_vault',
  },
  {
    name: 'Register Holder',
    objective: 'Register holder for compliance',
    expectWrite: true,
    writeTool: 'register_holder',
  },
  {
    name: 'Transfer Token',
    objective: `Transfer 1 MRWA to ${ACCOUNT_HASH}`,
    expectWrite: true,
    writeTool: 'transfer_token',
  },
  {
    name: 'Restake',
    objective: 'Restake between validators',
    expectWrite: true,
    writeTool: 'restake',
  },
  {
    name: 'Revoke Holder',
    objective: `Revoke holder ${ACCOUNT_HASH}`,
    expectWrite: true,
    writeTool: 'revoke_holder',
  },
  {
    name: 'Audit Subscription',
    objective: 'Subscribe to premium x402 audit feed',
    expectWrite: false,
    expect402: true,
  },
  {
    name: 'Token Issue',
    objective: 'Issue new MRWA tokens',
    expectWrite: true,
    writeTool: 'issue_token',
    optional: true,
  },
]

async function plannerExecute(objective) {
  const res = await fetch(`${BACKEND}/api/v1/planner/execute`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(API_KEY ? { 'x-api-key': API_KEY } : {}),
    },
    body: JSON.stringify({
      objective,
      callerPublicKey: PK,
      callerAccountHash: ACCOUNT_HASH,
    }),
  })
  const text = await res.text()
  let body
  try {
    body = JSON.parse(text)
  } catch {
    body = { raw: text }
  }
  return { status: res.status, body }
}

function hasUnsignedTx(result) {
  const steps = result?.steps ?? result?.data?.steps ?? []
  return steps.some((s) => s.unsignedTransaction && s.walletRequired)
}

function writeToolName(result) {
  const steps = result?.steps ?? result?.data?.steps ?? []
  const w = steps.find((s) => s.kind === 'write')
  return w?.tool ?? null
}

const results = []

for (const cmd of COMMANDS) {
  const entry = { command: cmd.name, objective: cmd.objective, checks: {} }
  try {
    const { status, body } = await plannerExecute(cmd.objective)
    const data = body.data ?? body
    entry.httpStatus = status

    entry.checks.planner = status === 200 ? 'PASS' : 'FAIL'
    if (status !== 200) {
      entry.reason = body?.error?.message ?? body?.message ?? JSON.stringify(body).slice(0, 200)
      entry.requiredFix = 'Fix planner route or backend error'
      results.push(entry)
      continue
    }

    const write = hasUnsignedTx(data)
    const tool = writeToolName(data)

    if (cmd.expect402) {
      const step = data.steps?.[0]
      const payRequired = step?.result?.error === 'PAYMENT_REQUIRED' || step?.result?.status === 402
      entry.checks.unsignedTx = payRequired ? 'PASS (x402 gate)' : 'FAIL'
      entry.checks.writeTool = payRequired ? 'PASS (read gate)' : 'FAIL'
      entry.overall = payRequired ? 'PASS' : 'FAIL'
      if (!payRequired) {
        entry.reason = 'Expected PAYMENT_REQUIRED for premium audit without x402 header'
        entry.requiredFix = 'subscribe_audit must return 402 without payment'
      }
      results.push(entry)
      continue
    }

    if (cmd.expectWrite) {
      entry.checks.unsignedTx = write ? 'PASS' : 'FAIL'
      entry.checks.writeTool = tool === cmd.writeTool ? 'PASS' : tool ? `PARTIAL (${tool})` : 'FAIL'
      entry.checks.txBuilder = write ? 'PASS' : 'FAIL'
      entry.overall =
        write && tool === cmd.writeTool
          ? 'PASS'
          : cmd.optional && !write
            ? 'NOT_IMPLEMENTED'
            : 'FAIL'
      if (!write) {
        entry.reason = body?.error?.message ?? 'No unsignedTransaction in planner response'
        if (cmd.writeTool === 'issue_token') {
          entry.requiredFix = 'issue_token not in write-tool-invoker WRITE_TOOLS set'
        } else if (entry.reason?.includes('account-hash')) {
          entry.requiredFix = 'Use callerAccountHash from wallet in planner-service'
        } else {
          entry.requiredFix = 'Ensure write tool invokes tx-builder and returns unsignedTransaction'
        }
      }
    } else {
      const hasRead = data.steps?.some((s) => s.kind === 'read' && s.result)
      entry.checks.readTools = hasRead ? 'PASS' : 'FAIL'
      entry.checks.noFakeWrite = !write ? 'PASS' : 'FAIL'
      entry.overall = hasRead && !write ? 'PASS' : 'FAIL'
      if (!hasRead) entry.reason = 'Read tools did not return results'
      if (write) {
        entry.reason = 'Read-only command produced unsigned write transaction'
        entry.requiredFix = 'Planner should not attach write steps to read objectives'
      }
    }
  } catch (err) {
    entry.overall = 'FAIL'
    entry.reason = err instanceof Error ? err.message : String(err)
    entry.requiredFix = 'Network or backend unavailable'
  }
  results.push(entry)
}

console.log(
  JSON.stringify({ backend: BACKEND, testedAt: new Date().toISOString(), results }, null, 2),
)
