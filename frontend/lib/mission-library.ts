export type MissionCategory =
  | 'Staking'
  | 'Compliance'
  | 'Yield'
  | 'Audit'
  | 'Portfolio'
  | 'Vault'
  | 'Payments'

export interface Mission {
  id: string
  title: string
  category: MissionCategory
  description: string
  objective: string
  requiresWallet: boolean
  requiresX402: boolean
  estimatedSteps: number
}

export const MISSION_CATEGORIES: MissionCategory[] = [
  'Staking',
  'Compliance',
  'Yield',
  'Audit',
  'Portfolio',
  'Vault',
  'Payments',
]

export const MISSION_LIBRARY: Mission[] = [
  {
    id: 'delegate-stake',
    title: 'Delegate Stake',
    category: 'Staking',
    description: 'Discover validators, then build a 500 CSPR native delegation transaction.',
    objective: 'Delegate 500 CSPR to the best validator',
    requiresWallet: true,
    requiresX402: false,
    estimatedSteps: 2,
  },
  {
    id: 'register-holder',
    title: 'Register Holder',
    category: 'Compliance',
    description: 'Read compliance status first, then build register_holder for wallet signing.',
    objective: 'Register a new compliant holder on MERIDIAN',
    requiresWallet: true,
    requiresX402: false,
    estimatedSteps: 2,
  },
  {
    id: 'compliance-audit',
    title: 'Compliance Audit',
    category: 'Compliance',
    description: 'Check holder compliance registry status from indexed backend data.',
    objective: 'Run a compliance audit for my connected wallet holder status',
    requiresWallet: false,
    requiresX402: false,
    estimatedSteps: 1,
  },
  {
    id: 'yield-report',
    title: 'Yield Report',
    category: 'Yield',
    description: 'Read current APY, staking totals, and recent distribution history.',
    objective: 'What is the current MRWA yield APY and distribution history?',
    requiresWallet: false,
    requiresX402: false,
    estimatedSteps: 2,
  },
  {
    id: 'portfolio-review',
    title: 'Portfolio Review',
    category: 'Portfolio',
    description: 'Aggregate token info, yield metrics, and validator landscape.',
    objective: 'Give me a portfolio snapshot: token info, yield, and validators',
    requiresWallet: false,
    requiresX402: false,
    estimatedSteps: 3,
  },
  {
    id: 'premium-x402-audit',
    title: 'Premium x402 Audit',
    category: 'Payments',
    description: 'Attempt premium audit feed; surfaces x402 payment requirement when gated.',
    objective: 'Subscribe to premium audit summaries with x402 payment',
    requiresWallet: false,
    requiresX402: true,
    estimatedSteps: 1,
  },
  {
    id: 'vault-deposit',
    title: 'Vault Deposit',
    category: 'Vault',
    description: 'Build deposit_to_vault unsigned transaction after reading yield context.',
    objective: 'Deposit 10 CSPR to the MERIDIAN staking vault',
    requiresWallet: true,
    requiresX402: false,
    estimatedSteps: 2,
  },
  {
    id: 'validator-scan',
    title: 'Validator Scan',
    category: 'Staking',
    description: 'List active Casper auction validators from live RPC.',
    objective: 'List top Casper validators for delegation',
    requiresWallet: false,
    requiresX402: false,
    estimatedSteps: 1,
  },
  {
    id: 'token-metadata',
    title: 'Token Metadata',
    category: 'Portfolio',
    description: 'Fetch MRWA token info and deployed contract addresses.',
    objective: 'Show MRWA token info and deployed contract addresses',
    requiresWallet: false,
    requiresX402: false,
    estimatedSteps: 1,
  },
  {
    id: 'transfer-mrwa',
    title: 'Transfer MRWA',
    category: 'Compliance',
    description: 'Build unsigned transfer_token transaction (requires wallet + recipient hash).',
    objective: 'Transfer 1000 MRWA to a compliant recipient',
    requiresWallet: true,
    requiresX402: false,
    estimatedSteps: 1,
  },
]

export const MISSION_COUNT = MISSION_LIBRARY.length
