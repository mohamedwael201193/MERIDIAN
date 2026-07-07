'use client'

import { ReactElement } from 'react'
import { Box, Stack, Typography, Skeleton } from '@mui/material'
import IconifyIcon from '@/nickelfox/components/base/IconifyIcon'
import { useWalletSession } from '@lib/hooks/useWalletSession'
import { useBriefingData } from '@lib/hooks/useBriefingData'
import { meridianTokens } from '@/design/tokens'
import { formatMotes } from '@lib/contracts'

function greetingName(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function BriefingHeader(): ReactElement {
  const wallet = useWalletSession()
  const briefing = useBriefingData()

  const balanceLabel = wallet.balanceMotes
    ? `${formatMotes(wallet.balanceMotes)} CSPR`
    : null

  return (
    <Box mb={3}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        gap={2}
      >
        <Box>
          <Typography
            sx={{
              ...meridianTokens.typography.display,
              color: 'common.white',
              mb: 0.5,
            }}
          >
            {greetingName()}
          </Typography>
          <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
            {wallet.connected ? (
              <>
                <IconifyIcon icon="mdi:wallet-outline" width={16} color={meridianTokens.color.success} />
                <Typography variant="body2" color="text.secondary">
                  Wallet connected
                  {balanceLabel ? ` · ${balanceLabel}` : ''}
                </Typography>
              </>
            ) : (
              <>
                <IconifyIcon icon="mdi:wallet-outline" width={16} color={meridianTokens.color.textMuted} />
                <Typography variant="body2" color="text.secondary">
                  Wallet not connected
                </Typography>
              </>
            )}
          </Stack>
        </Box>

        <Stack direction="row" alignItems="center" gap={1}>
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              bgcolor: briefing.agentHealthy ? meridianTokens.color.success : meridianTokens.color.warning,
              boxShadow: briefing.agentHealthy ? `0 0 12px ${meridianTokens.color.success}` : undefined,
            }}
          />
          <Typography variant="body2" color="text.secondary">
            {briefing.isLoading ? (
              <Skeleton width={120} />
            ) : briefing.agentHealthy ? (
              'Agent healthy'
            ) : (
              'Agent degraded'
            )}
          </Typography>
        </Stack>
      </Stack>
    </Box>
  )
}
