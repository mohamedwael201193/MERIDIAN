'use client'

import { useMemo, ReactElement } from 'react'
import { Box, Stack, Typography, Skeleton } from '@mui/material'
import IconifyIcon from '@/nickelfox/components/base/IconifyIcon'
import GlassCard from '@/design/components/GlassCard'
import { useBriefingData } from '@lib/hooks/useBriefingData'
import { meridianTokens } from '@/design/tokens'

interface MetricCardProps {
  title: string
  value: string
  subtitle: string
  icon: string
  status?: 'ok' | 'warn' | 'neutral'
  loading?: boolean
  index: number
}

function MetricCard({ title, value, subtitle, icon, status = 'neutral', loading, index }: MetricCardProps) {
  const statusColor =
    status === 'ok' ? meridianTokens.color.success : status === 'warn' ? meridianTokens.color.warning : meridianTokens.color.textSecondary

  return (
    <GlassCard
      animate
      elevated
      padding={meridianTokens.spacing.panelPadding}
      sx={{ height: '100%', minHeight: 148 }}
    >
      <Stack
        spacing={2}
        sx={{ height: '100%', animationDelay: `${index * 0.05}s` }}
      >
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1.5}>
          <Typography
            sx={{
              ...meridianTokens.typography.label,
              color: meridianTokens.color.textMuted,
              textAlign: 'left',
              pt: 0.25,
            }}
          >
            {title}
          </Typography>
          <Box
            sx={{
              width: 36,
              height: 36,
              flexShrink: 0,
              borderRadius: `${meridianTokens.radius.sm}px`,
              bgcolor: meridianTokens.color.accentMuted,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconifyIcon icon={icon} width={18} color={statusColor} />
          </Box>
        </Stack>

        {loading ? (
          <Stack spacing={1} alignItems="flex-start" width="100%">
            <Skeleton width="60%" height={32} sx={{ bgcolor: 'rgba(255,255,255,0.06)' }} />
            <Skeleton width="80%" sx={{ bgcolor: 'rgba(255,255,255,0.04)' }} />
          </Stack>
        ) : (
          <Stack spacing={0.75} alignItems="flex-start" width="100%" flex={1} justifyContent="flex-end">
            <Typography
              sx={{
                ...meridianTokens.typography.mono,
                fontSize: '1.35rem',
                fontWeight: 600,
                letterSpacing: '-0.03em',
                lineHeight: 1.2,
                color: 'common.white',
                textAlign: 'left',
                width: '100%',
              }}
            >
              {value}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ textAlign: 'left', lineHeight: 1.5, width: '100%' }}
            >
              {subtitle}
            </Typography>
          </Stack>
        )}
      </Stack>
    </GlassCard>
  )
}

export default function BriefingGrid({
  unsignedTxPending = false,
  runtimePhase = 'idle',
}: {
  unsignedTxPending?: boolean
  runtimePhase?: import('@lib/hooks/useAgentRuntime').RuntimePhase
}): ReactElement {
  const briefing = useBriefingData(unsignedTxPending, runtimePhase)

  const cards = useMemo(
    () => [
      {
        title: 'Portfolio',
        value: briefing.portfolioValue,
        subtitle: briefing.portfolioSubtitle,
        icon: 'mdi:briefcase-outline',
        status: 'neutral' as const,
      },
      {
        title: 'Compliance',
        value: briefing.complianceValue,
        subtitle: briefing.complianceSubtitle,
        icon: 'mdi:shield-check-outline',
        status: briefing.complianceStatus,
      },
      {
        title: 'Current yield',
        value: briefing.yieldValue,
        subtitle: briefing.yieldSubtitle,
        icon: 'mdi:chart-line',
        status: 'neutral' as const,
      },
      {
        title: 'Pending actions',
        value: briefing.pendingValue,
        subtitle: briefing.pendingSubtitle,
        icon: 'mdi:clock-outline',
        status: briefing.pendingCount > 0 ? ('warn' as const) : ('ok' as const),
      },
    ],
    [briefing],
  )

  return (
    <Box>
      <Box
        display="grid"
        gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }}
        gap={meridianTokens.spacing.panelGap}
      >
        {cards.map((card, i) => (
          <MetricCard key={card.title} {...card} loading={briefing.isLoading} index={i} />
        ))}
      </Box>

      {!briefing.isLoading ? (
        <GlassCard
          elevated
          padding={meridianTokens.spacing.panelPadding}
          sx={{ mt: meridianTokens.spacing.sectionGap }}
        >
          <Stack spacing={1.25} alignItems="flex-start">
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'left', lineHeight: 1.6 }}>
              <Box component="span" fontWeight={600} color="common.white">
                Today&apos;s insight:{' '}
              </Box>
              {briefing.insight}
            </Typography>
            {briefing.recommended.length > 0 ? (
              <Typography variant="caption" color="text.disabled" sx={{ textAlign: 'left', lineHeight: 1.5 }}>
                Recommended: {briefing.recommended.join(' · ')}
              </Typography>
            ) : null}
          </Stack>
        </GlassCard>
      ) : null}
    </Box>
  )
}
