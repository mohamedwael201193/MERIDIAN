export interface AgentTemplate {
  id: string
  name: string
  tagline: string
  icon: string
  description: string
  policies: string[]
  defaultObjectives: string[]
  memorySeeds: string[]
  skillId: string
}

export const AGENT_TEMPLATES: AgentTemplate[] = [
  {
    id: 'treasury',
    name: 'Treasury Agent',
    tagline: 'Capital allocation and vault operations',
    icon: 'mdi:bank-outline',
    description:
      'Manages CSPR and MRWA treasury flows. Reads yield and validator data before any vault deposit or restake.',
    policies: [
      'Never transfer without compliance pre-check',
      'Read yield rate before vault operations',
      'Require human approval for all write tools',
    ],
    defaultObjectives: [
      'Give me a portfolio snapshot: token info, yield, and validators',
      'Deposit 10 CSPR to the MERIDIAN staking vault',
    ],
    memorySeeds: ['Treasury operations require curator role for restake and distribute_rewards'],
    skillId: 'meridian',
  },
  {
    id: 'compliance',
    name: 'Compliance Agent',
    tagline: 'Holder registry and sanctions screening',
    icon: 'mdi:shield-check-outline',
    description:
      'Monitors compliance registry, registers holders, and blocks non-compliant transfers.',
    policies: [
      'Always call get_compliance_status before transfers',
      'register_holder requires compliance officer attestation',
      'revoke_holder only for sanctioned accounts',
    ],
    defaultObjectives: [
      'Run a compliance audit for my connected wallet holder status',
      'Register a new compliant holder on MERIDIAN',
    ],
    memorySeeds: ['ERC-3643 style compliance enforced on-chain via ComplianceRegistry'],
    skillId: 'meridian',
  },
  {
    id: 'yield',
    name: 'Yield Agent',
    tagline: 'Staking yield optimization',
    icon: 'mdi:chart-line',
    description:
      'Tracks APY, distribution history, and recommends delegation strategies on Casper testnet.',
    policies: [
      'Minimum 500 CSPR for native delegate_stake',
      'list_validators before any delegation',
      'Never auto-sign transactions',
    ],
    defaultObjectives: [
      'What is the current MRWA yield APY and distribution history?',
      'Delegate 500 CSPR to the best validator',
    ],
    memorySeeds: ['estimatedApyBps is zero until first on-chain distribution is indexed'],
    skillId: 'meridian',
  },
  {
    id: 'portfolio',
    name: 'Portfolio Agent',
    tagline: 'Read-only exposure analysis',
    icon: 'mdi:briefcase-outline',
    description: 'Aggregates read tools into executive summaries without wallet access.',
    policies: [
      'Read-only by default',
      'Combine get_token_info, get_yield_rate, list_validators',
      'Suggest write actions only after full read context',
    ],
    defaultObjectives: [
      'Give me a portfolio snapshot: token info, yield, and validators',
      'List all protocol KPIs from MCP read tools',
    ],
    memorySeeds: ['Dashboard is visualization only — MCP drives all chain actions'],
    skillId: 'meridian',
  },
  {
    id: 'audit',
    name: 'Audit Agent',
    tagline: 'Premium audit and event trail',
    icon: 'mdi:history',
    description: 'Accesses audit summaries and indexed events. Premium feed requires x402 payment.',
    policies: [
      'subscribe_audit returns 402 without payment header',
      'Free events available via backend indexer',
      'Log all audit access in agent traces',
    ],
    defaultObjectives: [
      'Subscribe to premium audit summaries with x402 payment',
      'Show recent audit summaries from backend',
    ],
    memorySeeds: ['CEP-88 audit contract emits on-chain attestations'],
    skillId: 'meridian',
  },
]

export function getTemplateById(id: string): AgentTemplate | undefined {
  return AGENT_TEMPLATES.find((t) => t.id === id)
}
