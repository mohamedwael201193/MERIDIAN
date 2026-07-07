'use client'

import { ReactElement } from 'react'
import { Box, Chip, Stack, Typography, Skeleton, Divider } from '@mui/material'
import IconifyIcon from '@/nickelfox/components/base/IconifyIcon'
import { useHealth, useReady, useEvents } from '@lib/hooks/useMeridianData'
import { useMcpHealth } from '@lib/hooks/useMcpHealth'
import { meridianTokens } from '@/design/tokens'
import { panelSurfaceSx } from '@/design/surface'
import { explorerTxUrl } from '@lib/contracts'

const CAPABILITIES = [
  { icon: 'mdi:robot-outline', label: 'MCP' },
  { icon: 'mdi:brain', label: 'Planner' },
  { icon: 'mdi:cash-multiple', label: 'x402' },
  { icon: 'mdi:shield-check', label: 'ERC-3643' },
] as const

export default function StatusRibbon(): ReactElement {
  const { data: health, isLoading: healthLoading } = useHealth()
  const { data: ready } = useReady()
  const { data: events } = useEvents(5)

  const { data: mcpHealth } = useMcpHealth()
  const lastTx = events?.find((e) => e.transaction_hash)?.transaction_hash
  const backendOk = ready?.status === 'ok' || health?.status === 'ok'
  const mcpTools = mcpHealth?.tools ?? null

  if (healthLoading) {
    return (
      <Box sx={{ mb: meridianTokens.spacing.ribbonMb }}>
        <Skeleton variant="rounded" height={52} sx={{ borderRadius: `${meridianTokens.radius.lg}px`, bgcolor: 'rgba(255,255,255,0.04)' }} />
      </Box>
    )
  }

  return (
    <Box
      sx={{
        mb: meridianTokens.spacing.ribbonMb,
        borderRadius: `${meridianTokens.radius.lg}px`,
        overflow: 'hidden',
        ...panelSurfaceSx(),
      }}
    >
      <Stack
        direction={{ xs: 'column', lg: 'row' }}
        alignItems={{ xs: 'stretch', lg: 'center' }}
        divider={
          <Divider
            orientation="vertical"
            flexItem
            sx={{
              display: { xs: 'none', lg: 'block' },
              borderColor: meridianTokens.surface.panelBorder,
              my: 1.5,
            }}
          />
        }
      >
        <Stack
          direction="row"
          alignItems="center"
          gap={1.5}
          sx={{ px: 2.5, py: 1.75, minWidth: { lg: 280 } }}
        >
          <Box
            sx={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              flexShrink: 0,
              bgcolor: backendOk ? meridianTokens.color.success : meridianTokens.color.warning,
              boxShadow: backendOk ? `0 0 12px ${meridianTokens.color.success}` : undefined,
            }}
          />
          <Box>
            <Typography
              variant="caption"
              sx={{
                ...meridianTokens.typography.label,
                color: meridianTokens.color.textMuted,
                display: 'block',
                mb: 0.35,
              }}
            >
              Protocol status
            </Typography>
            <Stack direction="row" alignItems="center" gap={1}>
              <Typography variant="body2" color="common.white" fontWeight={600}>
                {backendOk ? 'Live on Casper' : 'Connecting'}
              </Typography>
              <Chip
                size="small"
                label={backendOk ? 'Online' : 'Retrying'}
                color={backendOk ? 'success' : 'warning'}
                variant="outlined"
                sx={{ height: 22, '& .MuiChip-label': { px: 1, fontSize: 11, fontWeight: 600 } }}
              />
            </Stack>
          </Box>
        </Stack>

        <Stack
          direction="row"
          alignItems="center"
          gap={1}
          flexWrap="wrap"
          sx={{ px: 2.5, py: { xs: 0, lg: 1.75 }, pb: { xs: 1.75, lg: 1.75 }, flex: 1 }}
        >
          <Typography
            variant="caption"
            color="text.disabled"
            sx={{ ...meridianTokens.typography.label, mr: 0.5, display: { xs: 'none', sm: 'block' } }}
          >
            Stack
          </Typography>
          {CAPABILITIES.map((item) => (
            <Chip
              key={item.label}
              size="small"
              icon={<IconifyIcon icon={item.icon} width={14} />}
              label={item.label}
              variant="outlined"
              sx={{
                height: 28,
                fontSize: 11,
                fontWeight: 500,
                borderColor: meridianTokens.surface.panelBorder,
                color: meridianTokens.color.textSecondary,
                bgcolor: 'rgba(255,255,255,0.02)',
                '& .MuiChip-icon': { color: meridianTokens.color.textMuted },
              }}
            />
          ))}
        </Stack>

        <Stack
          direction="row"
          alignItems="center"
          gap={1.5}
          flexWrap="wrap"
          sx={{ px: 2.5, py: { xs: 0, lg: 1.75 }, pb: { xs: 1.75, lg: 1.75 }, minWidth: { lg: 200 } }}
        >
          <Chip
            size="small"
            variant="outlined"
            icon={<IconifyIcon icon="mdi:connection" width={14} />}
            label={mcpTools != null ? `${String(mcpTools)} tools` : 'MCP…'}
            sx={{
              height: 28,
              fontFamily: meridianTokens.typography.mono.fontFamily,
              fontSize: 11,
              borderColor: meridianTokens.surface.panelBorder,
            }}
          />
          {lastTx ? (
            <Box
              component="a"
              href={explorerTxUrl(lastTx)}
              target="_blank"
              rel="noreferrer"
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5,
                textDecoration: 'none',
                color: 'primary.light',
                fontFamily: meridianTokens.typography.mono.fontFamily,
                fontSize: 11,
                fontWeight: 500,
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              <IconifyIcon icon="mdi:open-in-new" width={12} />
              Latest tx
            </Box>
          ) : (
            <Typography
              variant="caption"
              color="text.disabled"
              sx={{ fontFamily: meridianTokens.typography.mono.fontFamily, fontSize: 11 }}
            >
              No recent txs
            </Typography>
          )}
        </Stack>
      </Stack>
    </Box>
  )
}
