export type McpToolKind = 'read' | 'write'

export interface McpToolMeta {
  name: string
  kind: McpToolKind
  description: string
  walletRequired: boolean
  requiredRole?: string
  expectedResult: string
  exampleArgs: Record<string, unknown>
}

export const MCP_TOOLS: McpToolMeta[] = [
  {
    name: 'get_token_info',
    kind: 'read',
    description: 'MRWA metadata and deployed contract addresses from the indexer.',
    walletRequired: false,
    expectedResult: 'JSON with deployed contracts and indexed token row.',
    exampleArgs: {},
  },
  {
    name: 'get_yield_rate',
    kind: 'read',
    description: 'Current estimated APY and total staked for MRWA.',
    walletRequired: false,
    expectedResult: 'estimatedApyBps, totalStaked, lastDistribution.',
    exampleArgs: {},
  },
  {
    name: 'get_holder_yield',
    kind: 'read',
    description: 'Recent global yield distribution history.',
    walletRequired: false,
    expectedResult: 'Array of era distribution records.',
    exampleArgs: { limit: 20 },
  },
  {
    name: 'get_compliance_status',
    kind: 'read',
    description: 'Compliance registry status for an account hash.',
    walletRequired: false,
    expectedResult: 'compliant flag, status, registration timestamps.',
    exampleArgs: { accountHash: 'account-hash-...' },
  },
  {
    name: 'list_validators',
    kind: 'read',
    description: 'Active Casper auction validators from live RPC.',
    walletRequired: false,
    expectedResult: 'validators array with public_key and stake.',
    exampleArgs: { limit: 10 },
  },
  {
    name: 'subscribe_audit',
    kind: 'read',
    description: 'Premium audit feed; requires x402 payment header when gated.',
    walletRequired: false,
    expectedResult: '402 hint without payment; summaries with payment.',
    exampleArgs: { limit: 10 },
  },
  {
    name: 'transfer_token',
    kind: 'write',
    description: 'Build unsigned MRWA transfer TransactionV1.',
    walletRequired: true,
    expectedResult: 'Unsigned transfer; sign in Casper Wallet.',
    exampleArgs: {
      callerPublicKey: '01...',
      recipientAccountHash: 'account-hash-...',
      amount: '1000',
    },
  },
  {
    name: 'register_holder',
    kind: 'write',
    description: 'Register a compliant holder in ComplianceRegistry.',
    walletRequired: true,
    expectedResult: 'Unsigned register_holder tx after attestation.',
    exampleArgs: {
      callerPublicKey: '01...',
      holderAccountHash: 'account-hash-...',
      attestationBytes: '00',
    },
  },
  {
    name: 'revoke_holder',
    kind: 'write',
    description: 'Revoke a holder for sanctions or policy violation.',
    walletRequired: true,
    requiredRole: 'COMPLIANCE_OFFICER',
    expectedResult: 'Unsigned revoke tx; officer role required on-chain.',
    exampleArgs: {
      callerPublicKey: '01...',
      holderAccountHash: 'account-hash-...',
      reason: 'sanctions match',
    },
  },
  {
    name: 'delegate_stake',
    kind: 'write',
    description: 'Native Casper delegation from user wallet (min 500 CSPR).',
    walletRequired: true,
    expectedResult: 'Unsigned native delegate tx; 500 CSPR minimum enforced.',
    exampleArgs: {
      callerPublicKey: '01...',
      validator: '01...',
      amount: '500000000000',
    },
  },
  {
    name: 'deposit_to_vault',
    kind: 'write',
    description: 'Deposit CSPR into MERIDIAN StakingVault (separate from native delegation).',
    walletRequired: true,
    expectedResult: 'Unsigned payable deposit; attach CSPR value when signing.',
    exampleArgs: { callerPublicKey: '01...', amount: '1000000000' },
  },
  {
    name: 'restake',
    kind: 'write',
    description: 'Move stake between validators inside the vault.',
    walletRequired: true,
    requiredRole: 'VALIDATOR_CURATOR',
    expectedResult: 'Unsigned restake tx; curator role required.',
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
    description: 'Trigger vault reward distribution for an era.',
    walletRequired: true,
    requiredRole: 'vault operator',
    expectedResult: 'Unsigned distribute_rewards tx.',
    exampleArgs: { callerPublicKey: '01...', eraId: 0 },
  },
]

export const MCP_SERVER_URL =
  process.env.NEXT_PUBLIC_MCP_SERVER_URL ?? 'https://meridian-mcp-server-94q4.onrender.com'

export const MASTER_AGENT_PROMPT = `You are connected to the MERIDIAN Casper MCP Server.

Immediately discover every available MCP tool.
Categorize every tool.
Explain for each:
- what it does
- required permissions / on-chain role
- wallet requirement (read = no wallet, write = wallet signature)
- expected result after execution

Rules:
1. Always call read tools before write tools.
2. Never request a wallet signature unless a write action is required.
3. For write tools: explain WHY signing is required, build the unsigned transaction, wait for the user to sign, then continue.
4. Enforce Casper minimum native delegation of 500 CSPR (500000000000 motes) before delegate_stake.
5. Separate native delegate_stake from MERIDIAN vault deposit_to_vault.
6. Summarize every transaction with explorer URL: https://testnet.cspr.live
7. Keep reasoning visible step-by-step.
8. For premium audit data, guide x402 payment when subscribe_audit returns 402.`
