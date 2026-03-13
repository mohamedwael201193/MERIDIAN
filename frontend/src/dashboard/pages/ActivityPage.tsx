'use client'

import { ReactElement } from 'react'
import { Box, Stack, Typography } from '@mui/material'
import { useAgentTraceStream } from '@lib/hooks/useAgentTraceStream'
import { loadAgentProfile } from '@lib/agent-profile'
import Link from 'next/link'
import GlassCard from '@/design/components/GlassCard'
import PageHeader from '@/components/PageHeader'
import IconifyIcon from '@/nickelfox/components/base/IconifyIcon'
import { meridianTokens } from '@/design/tokens'
import { explorerTxUrl } from '@lib/contracts'

function formatWhen(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

export default function ActivityPage(): ReactElement {
  const { traces } = useAgentTraceStream()
  const profile = loadAgentProfile()

  const milestones = traces.filter((t) =>
    ['complete', 'finality', 'deploy_broadcast', 'objective_received'].includes(t.step_type),
  )

  return (
    <Box>
      <PageHeader
        icon="mdi:history"
        eyebrow="History"
        title="History"
        description={
          profile.missionsCompleted > 0
            ? `${String(profile.missionsCompleted)} completed mission${profile.missionsCompleted === 1 ? '' : 's'}`
            : 'Completed missions and on-chain activity'
        }
      />

      <Stack gap={meridianTokens.spacing.panelGap}>
        {profile.history.length > 0
          ? profile.history.map((h) => {
              const sessionTraces = traces.filter((t) => t.session_id === h.sessionId)
              const txTrace = sessionTraces.find((t) => t.step_type === 'deploy_broadcast')
              const txPayload = txTrace?.payload as { transactionHash?: string } | undefined
              const txHash = txPayload?.transactionHash

              return (
                <GlassCard key={h.sessionId} padding={3}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={2}>
                    <Box flex={1}>
                      <Typography variant="body1" color="common.white" fontWeight={500} mb={0.5}>
                        {h.objective}
                      </Typography>
                      <Typography variant="caption" color="text.disabled">
                        {formatWhen(h.completedAt)}
                      </Typography>
                    </Box>
                    {txHash ? (
                      <Box
                        component="a"
                        href={explorerTxUrl(txHash)}
                        target="_blank"
                        rel="noreferrer"
                        sx={{ color: 'primary.light', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 0.5 }}
                      >
                        <IconifyIcon icon="mdi:open-in-new" width={16} />
                        <Typography variant="caption">Explorer</Typography>
                      </Box>
                    ) : null}
                  </Stack>
                </GlassCard>
              )
            })
          : milestones.slice(0, 12).map((t) => (
              <GlassCard key={t.id} padding={3}>
                <Typography variant="body2" color="common.white" mb={0.5}>
                  {t.message}
                </Typography>
                <Typography variant="caption" color="text.disabled">
                  {formatWhen(t.created_at)}
                </Typography>
              </GlassCard>
            ))}

        {profile.history.length === 0 && milestones.length === 0 ? (
          <GlassCard padding={6}>
            <Box textAlign="center">
              <IconifyIcon icon="mdi:history" width={40} color={meridianTokens.color.textMuted} />
              <Typography variant="h6" color="text.secondary" mt={2} mb={1}>
                No history yet
              </Typography>
              <Typography
                component={Link}
                href="/agent"
                variant="body1"
                color="primary.main"
                sx={{ textDecoration: 'none' }}
              >
                Open briefing and assign your first task
              </Typography>
            </Box>
          </GlassCard>
        ) : null}
      </Stack>
    </Box>
  )
}
