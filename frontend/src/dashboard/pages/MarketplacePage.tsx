'use client'

import { useState, ReactElement } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Alert,
  Box,
  Chip,
  Stack,
  Typography,
} from '@mui/material'
import { Icon } from '@iconify/react'
import { AGENT_TEMPLATES } from '@lib/agent-marketplace'
import { updateAgentProfile } from '@lib/agent-profile'
import PageHeader from '@/components/PageHeader'
import GlassCard from '@/design/components/GlassCard'
import PremiumButton from '@/design/components/PremiumButton'
import { meridianTokens } from '@/design/tokens'

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
      <PageHeader
        icon="mdi:store-outline"
        eyebrow="Agent Marketplace"
        title="Installable Agent Templates"
        description="Each template includes planner behavior, MERIDIAN skill, policies, and memory seeds."
      />

      <Stack gap={meridianTokens.spacing.sectionGap}>
        {AGENT_TEMPLATES.map((template) => (
          <GlassCard key={template.id} padding={3}>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              justifyContent="space-between"
              alignItems={{ xs: 'stretch', md: 'center' }}
              gap={3}
            >
              <Stack direction="row" gap={3} flex={1} minWidth={0}>
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
                <Box flex={1} minWidth={0}>
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
                  <Stack direction="row" gap={0.5} flexWrap="wrap">
                    {template.policies.map((p) => (
                      <Chip key={p} size="small" variant="outlined" label={p} />
                    ))}
                  </Stack>
                </Box>
              </Stack>
              <Stack
                direction="row"
                gap={1}
                flexWrap="wrap"
                alignItems="center"
                sx={{
                  flexShrink: 0,
                  alignSelf: { xs: 'flex-start', md: 'center' },
                }}
              >
                <PremiumButton
                  size="small"
                  icon="mdi:download"
                  onClick={() => installTemplate(template.id)}
                  sx={{
                    minWidth: 'auto',
                    px: 1.75,
                    py: 0.625,
                    fontSize: 13,
                    fontWeight: 600,
                    borderRadius: `${meridianTokens.radius.sm}px`,
                  }}
                >
                  Install
                </PremiumButton>
                <PremiumButton
                  size="small"
                  variant="outlined"
                  icon="mdi:play"
                  onClick={() => runTemplate(template.defaultObjectives[0] ?? '')}
                  sx={{
                    minWidth: 'auto',
                    px: 1.75,
                    py: 0.625,
                    fontSize: 13,
                    fontWeight: 600,
                    borderRadius: `${meridianTokens.radius.sm}px`,
                    borderColor: 'rgba(220,38,38,0.4)',
                    color: 'primary.light',
                    boxShadow: 'none',
                    '&:hover': {
                      borderColor: 'primary.main',
                      bgcolor: meridianTokens.color.accentMuted,
                      boxShadow: 'none',
                    },
                  }}
                >
                  Run default
                </PremiumButton>
              </Stack>
            </Stack>
          </GlassCard>
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
