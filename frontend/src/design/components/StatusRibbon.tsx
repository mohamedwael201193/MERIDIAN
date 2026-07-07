'use client'

import { ReactElement } from 'react'
import { Box, Chip, Stack, Typography, Skeleton } from '@mui/material'
import IconifyIcon from '@/nickelfox/components/base/IconifyIcon'
import { useHealth, useReady, useEvents } from '@lib/hooks/useMeridianData'
import { meridianTokens } from '@/design/tokens'
import { explorerTxUrl } from '@lib/contracts'

export default function StatusRibbon(): ReactElement {
  const { data: health, isLoading: healthLoading } = useHealth()
  const { data: ready } = useReady()
  const { data: events } = useEvents(5)

  const lastTx = events?.find((e) => e.transaction_hash)?.transaction_hash
  const backendOk = ready?.status === 'ok' || health?.status === 'ok'
  const mcpTools = 13

  if (healthLoading) {
    return (
      <Box sx={{ mb: 3 }}>
        <Skeleton variant="rounded" height={40} sx={{ borderRadius: 3, bgcolor: 'rgba(255,255,255,0.04)' }} />
      </Box>
    )
  }

  return (
    <Box
      sx={{
        mb: 3,
        py: 1.25,
        px: 2,
        borderRadius: `${meridianTokens.radius.md}px`,
        bgcolor: meridianTokens.color.glass,
        border: '1px solid',
        borderColor: meridianTokens.color.glassBorder,
        backdropFilter: 'blur(8px)',
      }}
    >
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        alignItems={{ xs: 'flex-start', md: 'center' }}
        justifyContent="space-between"
        gap={1.5}
      >
        <Stack direction="row" alignItems="center" gap={1.5} flexWrap="wrap">
          <Typography
            variant="caption"
            sx={{
              ...meridianTokens.typography.label,
              color: meridianTokens.color.textSecondary,
            }}
          >
            Autonomous compliant yield on Casper
          </Typography>
          <Chip
            size="small"
            icon={<IconifyIcon icon="mdi:circle" width={8} />}
            label={backendOk ? 'Live' : 'Connecting'}
            color={backendOk ? 'success' : 'warning'}
            variant="outlined"
            sx={{ height: 24, '& .MuiChip-icon': { color: backendOk ? 'success.main' : 'warning.main' } }}
          />
        </Stack>

        <Stack direction="row" alignItems="center" gap={2} flexWrap="wrap">
          <Stack direction="row" gap={0.75} alignItems="center">
            {[
              { icon: 'mdi:robot-outline', label: 'MCP' },
              { icon: 'mdi:brain', label: 'Planner' },
              { icon: 'mdi:cash-multiple', label: 'x402' },
              { icon: 'mdi:shield-check', label: 'ERC-3643' },
            ].map((item) => (
              <Chip
                key={item.label}
                size="small"
                icon={<IconifyIcon icon={item.icon} width={14} />}
                label={item.label}
                variant="outlined"
                sx={{
                  height: 26,
                  fontSize: 11,
                  borderColor: meridianTokens.color.glassBorder,
                  color: meridianTokens.color.textSecondary,
                }}
              />
            ))}
          </Stack>
          <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'var(--font-geist-mono, monospace)' }}>
            {mcpTools} tools
            {lastTx ? (
              <>
                {' · '}
                <Box
                  component="a"
                  href={explorerTxUrl(lastTx)}
                  target="_blank"
                  rel="noreferrer"
                  sx={{ color: 'primary.light', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                >
                  Latest tx
                </Box>
              </>
            ) : (
              ' · No recent txs'
            )}
          </Typography>
        </Stack>
      </Stack>
    </Box>
  )
}
