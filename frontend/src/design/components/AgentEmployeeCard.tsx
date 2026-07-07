'use client'

import { useState, ReactElement } from 'react'
import { Box, Collapse, Stack, Typography, Chip } from '@mui/material'
import { motion } from 'motion/react'
import IconifyIcon from '@/nickelfox/components/base/IconifyIcon'
import GlassCard from '@/design/components/GlassCard'
import PremiumButton from '@/design/components/PremiumButton'
import { meridianTokens } from '@/design/tokens'

export interface SpecialistAgent {
  id: string
  name: string
  role: string
  icon: string
  greeting: string
  capabilities: string[]
  objective: string
  status: 'active' | 'idle' | 'attention'
  lastAction?: string
}

interface AgentEmployeeCardProps {
  agent: SpecialistAgent
  onAssign: (objective: string) => void
  onInstall?: () => void
  installed?: boolean
}

export default function AgentEmployeeCard({
  agent,
  onAssign,
  onInstall,
  installed,
}: AgentEmployeeCardProps): ReactElement {
  const [expanded, setExpanded] = useState(false)

  const statusColor =
    agent.status === 'active'
      ? meridianTokens.color.success
      : agent.status === 'attention'
        ? meridianTokens.color.warning
        : meridianTokens.color.textMuted

  return (
    <GlassCard
      hover
      glow={agent.status === 'active'}
      onClick={() => setExpanded((v) => !v)}
      sx={{ cursor: 'pointer' }}
    >
      <Stack direction="row" gap={2} alignItems="flex-start">
        <motion.div
          animate={
            agent.status === 'active'
              ? { boxShadow: ['0 0 0px rgba(220,38,38,0)', '0 0 24px rgba(220,38,38,0.2)', '0 0 0px rgba(220,38,38,0)'] }
              : undefined
          }
          transition={{ repeat: Infinity, duration: 3 }}
          style={{
            width: 48,
            height: 48,
            borderRadius: meridianTokens.radius.md,
            backgroundColor: meridianTokens.color.accentMuted,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <IconifyIcon icon={agent.icon} width={24} color={meridianTokens.color.accent} />
        </motion.div>
        <Box flex={1}>
          <Stack direction="row" alignItems="center" gap={1} mb={0.25}>
            <Typography variant="h6" color="common.white" fontWeight={600}>
              {agent.name}
            </Typography>
            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: statusColor }} />
          </Stack>
          <Typography variant="body2" color="primary.light" mb={0.5}>
            {agent.role}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {agent.greeting}
          </Typography>
          <Stack direction="row" gap={0.75} flexWrap="wrap" mt={1.5}>
            {agent.capabilities.map((cap) => (
              <Chip
                key={cap}
                size="small"
                label={cap}
                sx={{
                  height: 22,
                  fontSize: 11,
                  bgcolor: 'rgba(255,255,255,0.05)',
                  border: '1px solid',
                  borderColor: meridianTokens.color.glassBorder,
                }}
              />
            ))}
          </Stack>
        </Box>
      </Stack>

      <Collapse in={expanded}>
        <Box mt={2} pt={2} borderTop="1px solid" borderColor="divider" onClick={(e) => e.stopPropagation()}>
          {agent.lastAction ? (
            <Typography variant="caption" color="text.disabled" display="block" mb={1.5}>
              Last activity: {agent.lastAction}
            </Typography>
          ) : null}
          <Stack direction="row" gap={1}>
            <PremiumButton
              size="small"
              icon="mdi:play"
              onClick={(e) => {
                e.stopPropagation()
                onAssign(agent.objective)
              }}
            >
              Assign task
            </PremiumButton>
            {onInstall && !installed ? (
              <PremiumButton size="small" variant="outlined" onClick={(e) => { e.stopPropagation(); onInstall() }}>
                Install
              </PremiumButton>
            ) : installed ? (
              <Chip size="small" color="success" label="Installed" />
            ) : null}
          </Stack>
        </Box>
      </Collapse>
    </GlassCard>
  )
}
