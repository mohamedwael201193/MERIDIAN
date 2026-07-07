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

export const SPECIALIST_AGENTS = [
  {
    id: 'yield',
    name: 'Yield',
    emoji: '📈',
    greeting: 'Tracks APY and helps you stake wisely',
    objective: 'What is the current MRWA yield APY and distribution history?',
  },
  {
    id: 'compliance',
    name: 'Compliance',
    emoji: '🛡️',
    greeting: 'Checks if you can invest and transfer',
    objective: 'Run a compliance audit for my connected wallet holder status',
  },
  {
    id: 'treasury',
    name: 'Treasury',
    emoji: '🏦',
    greeting: 'Manages vault deposits and capital',
    objective: 'Give me a portfolio snapshot: token info, yield, and validators',
  },
] as const
