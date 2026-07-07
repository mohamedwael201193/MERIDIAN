import { invokeWriteTool } from '../backend/dist/planner/write-tool-invoker.js'

const PK = '020257c5a3d8b76c0c5c8a4d12d6100f201e334dc1fbf53a10bccdc8769c59d969fd'
const AH = 'account-hash-d73864646338c6fef8649847103f8c7c6fd877433866bc059acd95a0548cc216'

const cases = [
  ['register_holder', { callerPublicKey: PK, holderAccountHash: AH, attestationBytes: '00' }],
  ['transfer_token', { callerPublicKey: PK, recipientAccountHash: AH, amount: '1' }],
  ['revoke_holder', { callerPublicKey: PK, holderAccountHash: AH, reason: 'test' }],
  ['delegate_stake', { callerPublicKey: PK, validator: PK, amount: '500000000000' }],
  ['deposit_to_vault', { callerPublicKey: PK, amount: '10000000000' }],
]

for (const [tool, args] of cases) {
  try {
    const tx = await invokeWriteTool(tool, args)
    console.log(`${tool}: PASS ${tx.transactionType}`)
  } catch (e) {
    console.log(`${tool}: FAIL ${e.message}`)
  }
}
