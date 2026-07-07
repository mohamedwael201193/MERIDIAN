export type AgentIdentityId = 'yield' | 'compliance' | 'treasury' | 'audit' | 'portfolio'

export interface AgentIdentity {
  id: AgentIdentityId
  /** Short callsign shown on the card header */
  codename: string
  department: string
  initials: string
  icon: string
}

export const AGENT_IDENTITIES: Record<AgentIdentityId, AgentIdentity> = {
  yield: {
    id: 'yield',
    codename: 'ORION',
    department: 'Yield Operations',
    initials: 'OR',
    icon: 'mdi:chart-line',
  },
  compliance: {
    id: 'compliance',
    codename: 'SENTINEL',
    department: 'Compliance & Registry',
    initials: 'SN',
    icon: 'mdi:shield-check-outline',
  },
  treasury: {
    id: 'treasury',
    codename: 'VAULT',
    department: 'Treasury & Capital',
    initials: 'VT',
    icon: 'mdi:bank-outline',
  },
  audit: {
    id: 'audit',
    codename: 'TRACE',
    department: 'Audit & Forensics',
    initials: 'TR',
    icon: 'mdi:file-search-outline',
  },
  portfolio: {
    id: 'portfolio',
    codename: 'PRISM',
    department: 'Portfolio Intelligence',
    initials: 'PR',
    icon: 'mdi:briefcase-outline',
  },
}

const FALLBACK_IDENTITY: AgentIdentity = {
  id: 'portfolio',
  codename: 'AGENT',
  department: 'Operations',
  initials: 'AG',
  icon: 'mdi:robot-outline',
}

export function resolveAgentIdentity(agentId: string): AgentIdentity {
  if (agentId in AGENT_IDENTITIES) {
    return AGENT_IDENTITIES[agentId as AgentIdentityId]
  }
  return FALLBACK_IDENTITY
}

export function statusLabel(status: 'active' | 'idle' | 'attention'): string {
  if (status === 'active') return 'Live'
  if (status === 'attention') return 'Needs review'
  return 'Standby'
}
