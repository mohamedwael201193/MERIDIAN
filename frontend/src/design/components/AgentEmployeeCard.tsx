'use client'

import { useState, ReactElement } from 'react'
import { Box, Collapse, Stack, Typography, Chip } from '@mui/material'
import { motion } from 'motion/react'
import IconifyIcon from '@/nickelfox/components/base/IconifyIcon'
import GlassCard from '@/design/components/GlassCard'
import PremiumButton from '@/design/components/PremiumButton'
import { meridianTokens } from '@/design/tokens'
import { panelSurfaceSx } from '@/design/surface'
import { resolveAgentIdentity, statusLabel } from '@lib/agent-identities'

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
  /** identity = full agent profile card; compact = briefing grid */
  variant?: 'identity' | 'compact'
}

function StatusPill({ status }: { status: SpecialistAgent['status'] }) {
  const isLive = status === 'active'
  const isAttention = status === 'attention'

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.75,
        px: 1.25,
        py: 0.4,
        borderRadius: 999,
        border: '1px solid',
        borderColor: isLive
          ? 'rgba(153,27,27,0.45)'
          : isAttention
            ? 'rgba(255,255,255,0.18)'
            : 'rgba(255,255,255,0.1)',
        bgcolor: isLive
          ? meridianTokens.color.accentMuted
          : 'rgba(255,255,255,0.04)',
      }}
    >
      <Box
        sx={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          bgcolor: isLive
            ? meridianTokens.color.accent
            : isAttention
              ? meridianTokens.color.textSecondary
              : meridianTokens.color.textMuted,
          boxShadow: isLive ? `0 0 8px ${meridianTokens.color.accent}` : undefined,
        }}
      />
      <Typography
        variant="caption"
        fontWeight={600}
        sx={{
          fontSize: 11,
          color: isLive ? 'primary.light' : 'text.secondary',
        }}
      >
        {statusLabel(status)}
      </Typography>
    </Box>
  )
}

export default function AgentEmployeeCard({
  agent,
  onAssign,
  onInstall,
  installed,
  variant = 'identity',
}: AgentEmployeeCardProps): ReactElement {
  const [expanded, setExpanded] = useState(false)
  const identity = resolveAgentIdentity(agent.id)
  const isIdentity = variant === 'identity'

  const actionRow = (
    <Stack direction="row" gap={1} flexWrap="wrap" onClick={(e) => e.stopPropagation()}>
      <PremiumButton
        size="small"
        icon="mdi:play"
        onClick={(e) => {
          e.stopPropagation()
          onAssign(agent.objective)
        }}
      >
        Assign mission
      </PremiumButton>
      {onInstall && !installed ? (
        <PremiumButton
          size="small"
          variant="outlined"
          onClick={(e) => {
            e.stopPropagation()
            onInstall()
          }}
        >
          Install
        </PremiumButton>
      ) : installed ? (
        <Chip size="small" variant="outlined" label="Installed" sx={{ borderColor: 'rgba(255,255,255,0.2)' }} />
      ) : null}
    </Stack>
  )

  if (!isIdentity) {
    return (
      <GlassCard hover glow={agent.status === 'active'} onClick={() => setExpanded((v) => !v)} sx={{ cursor: 'pointer' }}>
        <Stack direction="row" gap={2} alignItems="flex-start">
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: `${meridianTokens.radius.md}px`,
              bgcolor: meridianTokens.color.accentMuted,
              border: '1px solid rgba(153,27,27,0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <IconifyIcon icon={agent.icon} width={24} color={meridianTokens.color.accent} />
          </Box>
          <Box flex={1}>
            <Stack direction="row" alignItems="center" gap={1} mb={0.25}>
              <Typography variant="h6" color="common.white" fontWeight={600}>
                {agent.name}
              </Typography>
              <StatusPill status={agent.status} />
            </Stack>
            <Typography variant="body2" color="primary.light" mb={0.5}>
              {agent.role}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {agent.greeting}
            </Typography>
          </Box>
        </Stack>
        <Collapse in={expanded}>
          <Box mt={2} pt={2} borderTop="1px solid" borderColor="divider">
            {actionRow}
          </Box>
        </Collapse>
      </GlassCard>
    )
  }

  return (
    <Box
      onClick={() => setExpanded((v) => !v)}
      sx={{
        position: 'relative',
        borderRadius: `${meridianTokens.radius.lg}px`,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'transform 0.25s ease, box-shadow 0.25s ease',
        '&:hover': {
          transform: 'translateY(-3px)',
          boxShadow: meridianTokens.shadow.cardHover,
        },
      }}
    >
      <Box sx={{ ...panelSurfaceSx({ spark: agent.status === 'active' }) }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{
            px: 2.5,
            py: 1.5,
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            bgcolor: 'rgba(0,0,0,0.35)',
          }}
        >
          <Typography
            sx={{
              ...meridianTokens.typography.label,
              color: meridianTokens.color.textMuted,
              fontSize: 10,
            }}
          >
            {identity.department}
          </Typography>
          <Typography
            sx={{
              fontFamily: meridianTokens.typography.fontFamilyMono,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.2em',
              color: 'primary.light',
            }}
          >
            {identity.codename}
          </Typography>
        </Stack>

        <Box sx={{ p: 2.5 }}>
          <Stack direction="row" gap={2.5} alignItems="flex-start">
            <motion.div
              animate={
                agent.status === 'active'
                  ? {
                      boxShadow: [
                        '0 0 0px rgba(153,27,27,0)',
                        '0 0 28px rgba(153,27,27,0.35)',
                        '0 0 0px rgba(153,27,27,0)',
                      ],
                    }
                  : undefined
              }
              transition={{ repeat: Infinity, duration: 3 }}
              style={{ flexShrink: 0 }}
            >
              <Box
                sx={{
                  width: 72,
                  height: 72,
                  borderRadius: `${meridianTokens.radius.lg}px`,
                  bgcolor: meridianTokens.color.accentMuted,
                  border: '1px solid rgba(153,27,27,0.4)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '40%',
                    background: 'linear-gradient(180deg, rgba(153,27,27,0.2), transparent)',
                  }}
                />
                <IconifyIcon icon={agent.icon} width={28} color={meridianTokens.color.accent} />
                <Typography
                  sx={{
                    fontFamily: meridianTokens.typography.fontFamilyMono,
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: '0.15em',
                    color: meridianTokens.color.textMuted,
                    mt: 0.25,
                  }}
                >
                  {identity.initials}
                </Typography>
              </Box>
            </motion.div>

            <Box flex={1} minWidth={0}>
              <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap={1} mb={0.5}>
                <Typography variant="h6" color="common.white" fontWeight={700} letterSpacing="-0.02em">
                  {agent.name}
                </Typography>
                <StatusPill status={agent.status} />
              </Stack>
              <Typography variant="body2" fontWeight={600} color="primary.light" mb={1}>
                {agent.role}
              </Typography>
              <Typography variant="body2" color="text.secondary" lineHeight={1.55}>
                {agent.greeting}
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" gap={0.75} flexWrap="wrap" mt={2.5}>
            {agent.capabilities.map((cap) => (
              <Chip
                key={cap}
                size="small"
                label={cap}
                sx={{
                  height: 24,
                  fontSize: 11,
                  fontWeight: 500,
                  bgcolor: 'rgba(255,255,255,0.04)',
                  border: '1px solid',
                  borderColor: meridianTokens.color.glassBorder,
                  color: meridianTokens.color.textSecondary,
                  '& .MuiChip-label': { px: 1.25 },
                }}
              />
            ))}
          </Stack>

          {agent.lastAction ? (
            <Stack direction="row" alignItems="center" gap={0.75} mt={2}>
              <IconifyIcon icon="mdi:clock-outline" width={14} color={meridianTokens.color.textMuted} />
              <Typography variant="caption" color="text.disabled">
                Last activity · {agent.lastAction}
              </Typography>
            </Stack>
          ) : null}

          <Box mt={2.5} pt={2.5} borderTop="1px solid rgba(255,255,255,0.08)" onClick={(e) => e.stopPropagation()}>
            {actionRow}
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
