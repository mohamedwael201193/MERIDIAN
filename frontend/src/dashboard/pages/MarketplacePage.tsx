'use client'

import { useState, ReactElement } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Alert,
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import { Icon } from '@iconify/react'
import { AGENT_TEMPLATES } from '@lib/agent-marketplace'
import { updateAgentProfile } from '@lib/agent-profile'
import PageHeader from '@/components/PageHeader'
import StatusRibbon from '@/design/components/StatusRibbon'

export default function MarketplacePage(): ReactElement {
  const router = useRouter()
  const [installedId, setInstalledId] = useState<string | null>(null)

  const installTemplate = (templateId: string) => {
    const template = AGENT_TEMPLATES.find((t) => t.id === templateId)
    if (!template) return

    updateAgentProfile({
      activeTemplateId: template.id,
      name: template.name,
      installedSkills: ['meridian'],
      memory: template.memorySeeds,
    })
    setInstalledId(template.id)
  }

  const runTemplate = (objective: string) => {
    router.push(`/agent?objective=${encodeURIComponent(objective)}`)
  }

  return (
    <Box>
      <StatusRibbon />
      <PageHeader
        icon="mdi:store-outline"
        eyebrow="Agent Marketplace"
        title="Installable Agent Templates"
        description="Each template includes planner behavior, MERIDIAN skill, policies, and memory seeds."
      />

      <Stack gap={3}>
        {AGENT_TEMPLATES.map((template) => (
          <Paper key={template.id} sx={{ p: 3 }}>
            <Stack direction={{ xs: 'column', md: 'row' }} gap={3}>
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: 2,
                  bgcolor: 'primary.dark',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon icon={template.icon} width={28} color="#fff" />
              </Box>
              <Box flex={1}>
                <Stack direction="row" gap={1} alignItems="center" mb={0.5}>
                  <Typography variant="h6" color="common.white">
                    {template.name}
                  </Typography>
                  {installedId === template.id ? (
                    <Chip size="small" color="success" label="Installed" />
                  ) : null}
                </Stack>
                <Typography variant="body2" color="primary.light" mb={1}>
                  {template.tagline}
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  {template.description}
                </Typography>
                <Typography variant="caption" color="text.disabled" display="block" mb={0.5}>
                  Policies
                </Typography>
                <Stack direction="row" gap={0.5} flexWrap="wrap" mb={2}>
                  {template.policies.map((p) => (
                    <Chip key={p} size="small" variant="outlined" label={p} />
                  ))}
                </Stack>
                <Stack direction="row" gap={1} flexWrap="wrap">
                  <Button variant="contained" onClick={() => installTemplate(template.id)}>
                    Install Template
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => runTemplate(template.defaultObjectives[0] ?? '')}
                  >
                    Run Default Mission
                  </Button>
                </Stack>
              </Box>
            </Stack>
          </Paper>
        ))}
      </Stack>

      {installedId ? (
        <Alert severity="success" sx={{ mt: 3 }}>
          Template installed.{' '}
          <Link href="/agent" style={{ color: 'inherit', fontWeight: 600 }}>
            Open briefing
          </Link>{' '}
          to run missions with template policies and memory loaded.
        </Alert>
      ) : null}
    </Box>
  )
}
