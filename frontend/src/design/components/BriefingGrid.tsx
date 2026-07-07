'use client'

import { useMemo, ReactElement } from 'react'
import { Box, Grid, Typography, Skeleton } from '@mui/material'
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
    <GlassCard animate padding={2.5} sx={{ height: '100%' }}>
      <Box sx={{ animationDelay: `${index * 0.05}s` }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
          <Typography sx={{ ...meridianTokens.typography.label, color: meridianTokens.color.textMuted }}>
            {title}
          </Typography>
          <IconifyIcon icon={icon} width={18} color={statusColor} />
        </Box>
        {loading ? (
          <>
            <Skeleton width="60%" height={32} sx={{ bgcolor: 'rgba(255,255,255,0.06)' }} />
            <Skeleton width="80%" sx={{ mt: 1, bgcolor: 'rgba(255,255,255,0.04)' }} />
          </>
        ) : (
          <>
            <Typography variant="h5" color="common.white" fontWeight={700} letterSpacing="-0.02em">
              {value}
            </Typography>
            <Typography variant="caption" color="text.secondary" mt={0.5} display="block">
              {subtitle}
            </Typography>
          </>
        )}
      </Box>
    </GlassCard>
  )
}

export default function BriefingGrid(): ReactElement {
  const briefing = useBriefingData()

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
    <Box mb={3}>
      <Grid container spacing={2}>
        {cards.map((card, i) => (
          <Grid item xs={12} sm={6} md={3} key={card.title}>
            <MetricCard {...card} loading={briefing.isLoading} index={i} />
          </Grid>
        ))}
      </Grid>

      {!briefing.isLoading ? (
        <GlassCard sx={{ mt: 2 }} padding={2}>
          <Typography variant="body2" color="text.secondary" mb={1}>
            <Box component="span" fontWeight={600} color="common.white">
              Today&apos;s insight:{' '}
            </Box>
            {briefing.insight}
          </Typography>
          {briefing.recommended.length > 0 ? (
            <Typography variant="caption" color="text.disabled">
              Recommended: {briefing.recommended.join(' · ')}
            </Typography>
          ) : null}
        </GlassCard>
      ) : null}
    </Box>
  )
}
