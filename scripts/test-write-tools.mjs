import { invokeWriteTool } from '../backend/dist/planner/write-tool-invoker.js'

const PK = '020257c5a3d8b76c0c5c8a4d12d6100f201e334dc1fbf53a10bccdc8769c59d969fd'
const AH = 'account-hash-d73864646338c6fef8649847103f8c7c6fd877433866bc059acd95a0548cc216'

const cases = [
  ['register_holder', { callerPublicKey: PK, holderAccountHash: AH, attestationBytes: 'default' }, 'pass'],
  ['transfer_token', { callerPublicKey: PK, recipientAccountHash: AH, amount: '1' }, 'pass'],
  ['revoke_holder', { callerPublicKey: PK, holderAccountHash: AH, reason: 'test' }, 'pass'],
  ['delegate_stake', { callerPublicKey: PK, validator: PK, amount: '500000000000' }, 'pass'],
  ['deposit_to_vault', { callerPublicKey: PK, amount: '10000000000' }, 'blocked'],
  ['distribute_rewards', { callerPublicKey: PK, eraId: 0 }, 'blocked'],
]

let failed = false

for (const [tool, args, expected] of cases) {
  try {
    const tx = await invokeWriteTool(tool, args)
    if (expected === 'blocked') {
      console.log(`${tool}: FAIL expected blocked but built ${tx.transactionType}`)
      failed = true
    } else {
      console.log(`${tool}: PASS ${tx.transactionType}`)
    }
  } catch (e) {
    if (expected === 'blocked') {
      console.log(`${tool}: EXPECTED_BLOCKED ${e.message}`)
    } else {
      console.log(`${tool}: FAIL ${e.message}`)
      failed = true
    }
  }
}

if (failed) process.exit(1)
