export const SPECIALIST_AGENTS = [
  {
    id: 'yield',
    name: 'Yield Analyst',
    role: 'Staking and APY optimization',
    icon: 'mdi:chart-line',
    greeting: 'Tracks APY, distributions, and delegation strategies',
    capabilities: ['APY tracking', 'Validator compare', 'Stake planning'],
    objective: 'What is the current MRWA yield APY and distribution history?',
  },
  {
    id: 'compliance',
    name: 'Compliance Officer',
    role: 'ERC-3643 registry and sanctions',
    icon: 'mdi:shield-check-outline',
    greeting: 'Verifies holder status before transfers and investments',
    capabilities: ['Holder registry', 'Sanctions check', 'Registration'],
    objective: 'Run a compliance audit for my connected wallet holder status',
  },
  {
    id: 'treasury',
    name: 'Treasury Manager',
    role: 'Portfolio and vault operations',
    icon: 'mdi:bank-outline',
    greeting: 'Aggregates token, yield, and validator positions',
    capabilities: ['Portfolio view', 'Vault deposits', 'Capital allocation'],
    objective: 'Give me a portfolio snapshot: token info, yield, and validators',
  },
  {
    id: 'audit',
    name: 'Audit Investigator',
    role: 'On-chain events and premium reports',
    icon: 'mdi:file-search-outline',
    greeting: 'Reviews CEP-88 events and x402 audit summaries',
    capabilities: ['Event trail', 'x402 unlock', 'Risk signals'],
    objective: 'Subscribe to premium audit summaries with x402 payment',
  },
  {
    id: 'portfolio',
    name: 'Portfolio Advisor',
    role: 'Read-only aggregation',
    icon: 'mdi:briefcase-outline',
    greeting: 'Summarizes positions without initiating writes',
    capabilities: ['Token info', 'Yield history', 'Validator map'],
    objective: 'Give me a portfolio snapshot: token info, yield, and validators',
  },
] as const

export const STARTER_PROMPTS = [
  { id: 'yield', label: "What's my yield?", objective: 'What is the current MRWA yield APY?' },
  {
    id: 'stake',
    label: 'Stake 500 CSPR',
    objective: 'Delegate 500 CSPR to the best validator',
  },
  {
    id: 'compliance',
    label: 'Am I approved to invest?',
    objective: 'Run a compliance audit for my connected wallet holder status',
  },
  {
    id: 'portfolio',
    label: 'Show my portfolio',
    objective: 'Give me a portfolio snapshot: token info, yield, and validators',
  },
  {
    id: 'audit',
    label: 'Security audit',
    objective: 'Subscribe to premium audit summaries with x402 payment',
  },
] as const
