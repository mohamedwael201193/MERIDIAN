'use client'

const STORAGE_KEY = 'meridian_agent_profile'

export interface AgentProfile {
  id: string
  name: string
  walletPublicKey: string | null
  installedSkills: string[]
  connectedMcpServers: string[]
  memory: string[]
  planner: 'meridian'
  missionsCompleted: number
  activeTemplateId: string | null
  history: Array<{ objective: string; sessionId: string; completedAt: string }>
  createdAt: string
  updatedAt: string
}

function defaultProfile(): AgentProfile {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    name: 'MERIDIAN Agent',
    walletPublicKey: null,
    installedSkills: [],
    connectedMcpServers: [],
    memory: [],
    planner: 'meridian',
    missionsCompleted: 0,
    activeTemplateId: null,
    history: [],
    createdAt: now,
    updatedAt: now,
  }
}

export function loadAgentProfile(): AgentProfile {
  if (typeof window === 'undefined') return defaultProfile()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultProfile()
    return { ...defaultProfile(), ...(JSON.parse(raw) as AgentProfile) }
  } catch {
    return defaultProfile()
  }
}

export function saveAgentProfile(profile: AgentProfile): void {
  if (typeof window === 'undefined') return
  const next = { ...profile, updatedAt: new Date().toISOString() }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
}

export function updateAgentProfile(patch: Partial<AgentProfile>): AgentProfile {
  const current = loadAgentProfile()
  const next = { ...current, ...patch, updatedAt: new Date().toISOString() }
  saveAgentProfile(next)
  return next
}

export function recordMissionComplete(
  objective: string,
  sessionId: string,
  walletPublicKey?: string | null,
): AgentProfile {
  const current = loadAgentProfile()
  return updateAgentProfile({
    missionsCompleted: current.missionsCompleted + 1,
    ...(walletPublicKey ? { walletPublicKey } : {}),
    history: [
      { objective, sessionId, completedAt: new Date().toISOString() },
      ...current.history,
    ].slice(0, 50),
  })
}
