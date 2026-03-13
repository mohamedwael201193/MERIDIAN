'use client'

import { ReactElement } from 'react'
import { Alert, Box, Chip, Paper, Skeleton, Stack, Typography } from '@mui/material'
import SaleCard from '@/nickelfox/components/sections/dashboard/todays-sales/SaleCard'
import { useProtocolKpis } from '@lib/hooks/useMeridianData'
import { formatApy, formatMotes } from '@lib/contracts'
import { meridianTokens } from '@/design/tokens'

const TodaysSales = (): ReactElement => {
  const { isLoading, error, kpis } = useProtocolKpis()

  const salesData = [
    {
      id: 1,
      icon: 'mdi:currency-usd',
      title: isLoading ? '…' : formatMotes(kpis.totalStaked),
      subtitle: 'CSPR Staked',
      detail: 'Indexed from StakingVault',
      color: 'primary.main',
    },
    {
      id: 2,
      icon: 'mdi:percent-outline',
      title: isLoading ? '…' : formatApy(kpis.estimatedApyBps),
      subtitle: 'Estimated APY',
      detail: 'From YieldDistributor',
      color: 'error.main',
    },
    {
      id: 3,
      icon: 'mdi:shield-check',
      title: isLoading ? '…' : String(kpis.compliantHolders),
      subtitle: 'Compliant Holders',
      detail: 'ComplianceRegistry',
      color: 'success.main',
    },
    {
      id: 4,
      icon: 'mdi:token',
      title: isLoading ? '…' : String(kpis.activeTokens),
      subtitle: 'Active Tokens',
      detail: 'Live contract registry',
      color: 'warning.main',
    },
  ]

  return (
    <Paper sx={{ p: meridianTokens.spacing.panelPadding, height: 1 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={meridianTokens.spacing.panelGap} mb={meridianTokens.spacing.sectionGap}>
        <Box>
          <Typography variant="h4" color="common.white" mb={1}>
            Protocol KPIs
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {error
              ? 'Backend unavailable — retrying…'
              : `Live index · Era ${kpis.currentEra} · Casper Testnet`}
          </Typography>
        </Box>
        <Chip color={error ? 'warning' : 'success'} label={error ? 'Retrying' : 'Live'} />
      </Stack>
      {error ? (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Could not load live KPIs. Showing last known values when available.
        </Alert>
      ) : null}
      <Box display="grid" gridTemplateColumns="repeat(12, 1fr)" gap={meridianTokens.spacing.sectionGap}>
        {isLoading
          ? Array.from({ length: 4 }).map((_, index) => (
              <Box key={index} gridColumn={{ xs: 'span 12', sm: 'span 6', lg: 'span 3' }}>
                <Skeleton
                  variant="rounded"
                  height={180}
                  sx={{ bgcolor: 'rgba(255,255,255,0.04)' }}
                />
              </Box>
            ))
          : salesData.map((saleItem) => (
              <Box key={saleItem.id} gridColumn={{ xs: 'span 12', sm: 'span 6', lg: 'span 3' }}>
                <SaleCard saleItem={saleItem} />
              </Box>
            ))}
      </Box>
    </Paper>
  )
}

export default TodaysSales
