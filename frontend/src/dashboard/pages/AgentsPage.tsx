'use client'

import { ReactElement } from 'react'
import { Box, Stack, Typography } from '@mui/material'
import { useRouter } from 'next/navigation'
import { useDecisions } from '@lib/hooks/useMeridianData'
import { useAgentTraceStream } from '@lib/hooks/useAgentTraceStream'
import { AGENT_TEMPLATES } from '@lib/agent-marketplace'
import { SPECIALIST_AGENTS } from '@lib/starter-prompts'
import { updateAgentProfile, loadAgentProfile } from '@lib/agent-profile'
import AgentEmployeeCard from '@/design/components/AgentEmployeeCard'
import PageHeader from '@/components/PageHeader'
import { meridianTokens } from '@/design/tokens'

function formatWhen(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

export default function AgentsPage(): ReactElement {
  const router = useRouter()
  const decisions = useDecisions(50)
  const { traces } = useAgentTraceStream()
  const profile = loadAgentProfile()

  const lastTraceFor = (keyword: string): string | undefined => {
    const match = [...traces].reverse().find((t) => t.message?.toLowerCase().includes(keyword))
    return match ? formatWhen(match.created_at) : undefined
  }

  const statusFor = (id: string): 'active' | 'idle' | 'attention' => {
    const pending = decisions.data?.filter(
      (d) => d.agent_name.toLowerCase().includes(id) && d.approved === null,
    )
    if (pending && pending.length > 0) return 'attention'
    const active = decisions.data?.filter((d) => d.agent_name.toLowerCase().includes(id))
    if (active && active.length > 0) return 'active'
    if (traces.some((t) => t.agent_name?.toLowerCase().includes(id))) return 'active'
    return 'idle'
  }

  const assign = (objective: string) => {
    router.push(`/agent?objective=${encodeURIComponent(objective)}`)
  }

  const installTemplate = (templateId: string) => {
    const template = AGENT_TEMPLATES.find((t) => t.id === templateId)
    if (!template) return
    updateAgentProfile({
      activeTemplateId: template.id,
      name: template.name,
      installedSkills: ['meridian'],
      memory: template.memorySeeds,
    })
  }

  const liveCount = SPECIALIST_AGENTS.filter((a) => statusFor(a.id) === 'active').length

  return (
    <Box>
      <PageHeader
        icon="mdi:robot-outline"
        eyebrow="Agents"
        title="Agents"
        description="Installable AI employees for yield, compliance, treasury, and audit operations"
      />

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        justifyContent="space-between"
        gap={1}
        mb={2.5}
      >
        <Box>
          <Typography variant="subtitle1" color="common.white" fontWeight={600}>
            Core specialists
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Each agent has a dedicated identity, tool scope, and mission profile
          </Typography>
        </Box>
        <Typography
          variant="caption"
          sx={{
            fontFamily: meridianTokens.typography.fontFamilyMono,
            color: meridianTokens.color.textMuted,
            px: 1.5,
            py: 0.5,
            borderRadius: 2,
            border: '1px solid rgba(255,255,255,0.1)',
            bgcolor: 'rgba(255,255,255,0.03)',
          }}
        >
          {liveCount} live · {SPECIALIST_AGENTS.length} total
        </Typography>
      </Stack>

      <Box
        display="grid"
        gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr', xl: 'repeat(3, 1fr)' }}
        gap={meridianTokens.spacing.panelGap}
        mb={meridianTokens.spacing.sectionGap}
      >
        {SPECIALIST_AGENTS.map((agent) => (
          <AgentEmployeeCard
            key={agent.id}
            variant="identity"
            agent={{
              ...agent,
              capabilities: [...agent.capabilities],
              status: statusFor(agent.id),
              lastAction: lastTraceFor(agent.id) ?? lastTraceFor(agent.name.split(' ')[0].toLowerCase()),
            }}
            onAssign={assign}
            installed={profile.activeTemplateId === agent.id}
            onInstall={() => installTemplate(agent.id)}
          />
        ))}
      </Box>

      <Typography variant="subtitle1" color="common.white" fontWeight={600} mb={0.5}>
        Marketplace templates
      </Typography>
      <Typography variant="caption" color="text.secondary" display="block" mb={2.5}>
        Pre-configured agent profiles with policies and default missions
      </Typography>
      <Box
        display="grid"
        gridTemplateColumns={{ xs: '1fr', lg: '1fr 1fr' }}
        gap={meridianTokens.spacing.panelGap}
      >
        {AGENT_TEMPLATES.map((template) => (
          <AgentEmployeeCard
            key={template.id}
            variant="identity"
            agent={{
              id: template.id,
              name: template.name,
              role: template.tagline,
              icon: template.icon,
              greeting: template.description,
              capabilities: template.policies.slice(0, 3),
              objective: template.defaultObjectives[0] ?? '',
              status: profile.activeTemplateId === template.id ? 'active' : 'idle',
            }}
            onAssign={assign}
            onInstall={() => installTemplate(template.id)}
            installed={profile.activeTemplateId === template.id}
          />
        ))}
      </Box>
    </Box>
  )
}
