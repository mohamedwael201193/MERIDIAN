#!/usr/bin/env node
/** MERIDIAN MCP self-test — run after deploy */
const BASE = process.env.MERIDIAN_API_URL ?? 'https://meridian-frontend-kappa.vercel.app/api/mcp'
const MCP_HEALTH = process.env.MERIDIAN_MCP_URL ?? 'https://meridian-mcp-server-94q4.onrender.com'

const READ_TOOLS = [
  ['get_token_info', {}],
  ['get_yield_rate', {}],
  ['get_holder_yield', { limit: 5 }],
  [
    'get_compliance_status',
    {
      accountHash: 'account-hash-267bc977600c9512c0ce5e96af4d0057d514998cc752e28b8f5e91b654a72c27',
    },
  ],
  ['list_validators', { limit: 3 }],
  ['subscribe_audit', { limit: 5 }],
]

const CALLER = '020257c5a3d8b76c0c5c8a4d12d6100f201e334dc1fbf53a10bccdc8769c59d969fd'

async function mcp(tool, args) {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tool, arguments: args }),
  })
  return res.json()
}

async function main() {
  const health = await fetch(`${MCP_HEALTH}/health`).then((r) => r.json())
  console.log('MCP health tools:', health.tools)
  if (health.tools !== 13) process.exitCode = 1

  for (const [tool, args] of READ_TOOLS) {
    const body = await mcp(tool, args)
    const ok = body.result != null && !body.error
    console.log(`${ok ? 'PASS' : 'FAIL'} read ${tool}`)
    if (!ok) process.exitCode = 1
  }

  const validators = await mcp('list_validators', { limit: 1 })
  const v = validators.result?.validators?.[0]?.public_key
  const delegate = await mcp('delegate_stake', {
    callerPublicKey: CALLER,
    validator: v,
    amount: '500000000000',
  })
  console.log(
    delegate.result?.transactionType === 'delegate_stake'
      ? 'PASS write delegate_stake'
      : 'FAIL delegate_stake',
  )

  const tooSmall = await mcp('delegate_stake', {
    callerPublicKey: CALLER,
    validator: v,
    amount: '1000000000',
  })
  const rejected =
    String(tooSmall.result ?? '').includes('500 CSPR') ||
    String(tooSmall.error?.message ?? '').includes('500')
  console.log(rejected ? 'PASS min 500 CSPR guard' : 'FAIL min guard')

  console.log('Self-test complete')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
