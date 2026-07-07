'use client'

import { ReactElement } from 'react'
import { Box, Grid, Stack, Typography } from '@mui/material'
import { useRouter } from 'next/navigation'
import { useDecisions } from '@lib/hooks/useMeridianData'
import { useAgentTraceStream } from '@lib/hooks/useAgentTraceStream'
import { AGENT_TEMPLATES } from '@lib/agent-marketplace'
import { SPECIALIST_AGENTS } from '@lib/starter-prompts'
import { updateAgentProfile, loadAgentProfile } from '@lib/agent-profile'
import AgentEmployeeCard from '@/design/components/AgentEmployeeCard'
import StatusRibbon from '@/design/components/StatusRibbon'
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

  return (
    <Box maxWidth={meridianTokens.spacing.pageMax} mx="auto">
      <StatusRibbon />
      <Typography sx={{ ...meridianTokens.typography.display, color: 'common.white', mb: 0.5 }}>
        Agents
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={4}>
        Installable AI employees for yield, compliance, treasury, and audit operations
      </Typography>

      <Typography variant="subtitle2" color="text.secondary" mb={2}>
        Core specialists
      </Typography>
      <Grid container spacing={2} mb={5}>
        {SPECIALIST_AGENTS.map((agent) => (
          <Grid item xs={12} md={6} key={agent.id}>
            <AgentEmployeeCard
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
          </Grid>
        ))}
      </Grid>

      <Typography variant="subtitle2" color="text.secondary" mb={2}>
        Marketplace templates
      </Typography>
      <Stack gap={2}>
        {AGENT_TEMPLATES.map((template) => (
          <AgentEmployeeCard
            key={template.id}
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
      </Stack>
    </Box>
  )
}
