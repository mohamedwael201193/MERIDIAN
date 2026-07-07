export interface ToolDefinition {
  name: string
  kind: 'read' | 'write'
  description: string
  requiredRole?: string
  minAmountMotes?: string
  exampleArgs: Record<string, unknown>
}

export const PLANNER_TOOL_CATALOG: ToolDefinition[] = [
  {
    name: 'get_token_info',
    kind: 'read',
    description: 'Token metadata and deployed contract addresses from the indexer.',
    exampleArgs: {},
  },
  {
    name: 'get_yield_rate',
    kind: 'read',
    description: 'Current APY and total staked for MRWA.',
    exampleArgs: {},
  },
  {
    name: 'get_holder_yield',
    kind: 'read',
    description: 'Recent yield distribution history.',
    exampleArgs: { limit: 20 },
  },
  {
    name: 'get_compliance_status',
    kind: 'read',
    description: 'Compliance registry status for an account hash.',
    exampleArgs: { accountHash: 'account-hash-...' },
  },
  {
    name: 'list_validators',
    kind: 'read',
    description: 'Active Casper auction validators from live RPC.',
    exampleArgs: { limit: 10 },
  },
  {
    name: 'subscribe_audit',
    kind: 'read',
    description: 'Premium audit feed; requires x402 payment header.',
    exampleArgs: { limit: 10 },
  },
  {
    name: 'transfer_token',
    kind: 'write',
    description: 'Unsigned MRWA transfer. Wallet signature required.',
    exampleArgs: {
      callerPublicKey: '01...',
      recipientAccountHash: 'account-hash-...',
      amount: '1000',
    },
  },
  {
    name: 'register_holder',
    kind: 'write',
    description: 'Register a compliant holder. Deployed contract requires owner signer.',
    requiredRole: 'CONTRACT_OWNER',
    exampleArgs: {
      callerPublicKey: '01...',
      holderAccountHash: 'account-hash-...',
      attestationBytes: 'default',
    },
  },
  {
    name: 'revoke_holder',
    kind: 'write',
    description: 'Revoke a holder for sanctions or policy violation.',
    requiredRole: 'compliance officer',
    exampleArgs: {
      callerPublicKey: '01...',
      holderAccountHash: 'account-hash-...',
      reason: 'sanctions match',
    },
  },
  {
    name: 'delegate_stake',
    kind: 'write',
    description: 'Native Casper delegation from the connected wallet.',
    minAmountMotes: '500000000000',
    exampleArgs: {
      callerPublicKey: '01...',
      validator: '01...',
      amount: '500000000000',
    },
  },
  {
    name: 'deposit_to_vault',
    kind: 'write',
    description:
      'Deposit CSPR into MERIDIAN StakingVault. Blocked until TransactionV1 builder supports Odra payable __cargo_purse wiring.',
    minAmountMotes: '1000000000',
    exampleArgs: {
      callerPublicKey: '01...',
      amount: '1000000000',
    },
  },
  {
    name: 'restake',
    kind: 'write',
    description: 'Move stake between validators inside the vault. Curator role required.',
    requiredRole: 'VALIDATOR_CURATOR',
    exampleArgs: {
      callerPublicKey: '01...',
      fromValidator: '01...',
      toValidator: '01...',
      amount: '500000000000',
    },
  },
  {
    name: 'distribute_rewards',
    kind: 'write',
    description:
      'Trigger vault reward distribution. Blocked for user wallets because StakingVault requires YieldDistributor contract caller.',
    requiredRole: 'YieldDistributor contract caller',
    exampleArgs: { callerPublicKey: '01...', eraId: 0 },
  },
]

export const READ_TOOL_NAMES = PLANNER_TOOL_CATALOG.filter((t) => t.kind === 'read').map(
  (t) => t.name,
)
export const WRITE_TOOL_NAMES = PLANNER_TOOL_CATALOG.filter((t) => t.kind === 'write').map(
  (t) => t.name,
)
