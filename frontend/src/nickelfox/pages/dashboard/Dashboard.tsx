'use client'

import { ReactElement } from 'react'
import { Box, Button, Chip, Paper, Stack, Typography } from '@mui/material'
import Link from 'next/link'

import CustomerFulfillment from '@/nickelfox/components/sections/dashboard/customer-fulfilment/CustomerFulfillment'
import VisitorInsights from '@/nickelfox/components/sections/dashboard/visitor-insights/VisitorInsights'
import TodaysSales from '@/nickelfox/components/sections/dashboard/todays-sales/TodaysSales'
import TopProducts from '@/nickelfox/components/sections/dashboard/top-products/TopProducts'
import TrendingNow from '@/nickelfox/components/sections/dashboard/trending-now/TrendingNow'
import Customers from '@/nickelfox/components/sections/dashboard/customers/Customers'
import Earnings from '@/nickelfox/components/sections/dashboard/earnings/Earnings'
import Level from '@/nickelfox/components/sections/dashboard/level/Level'
import IconifyIcon from '@/nickelfox/components/base/IconifyIcon'
import PageHeader from '@/components/PageHeader'
import { useReady } from '@lib/hooks/useMeridianData'
import { meridianTokens } from '@/design/tokens'

const QUICK_ACTIONS = [
  { href: '/issue', label: 'Issue Token', icon: 'mdi:token' },
  { href: '/compliance', label: 'Check Compliance', icon: 'mdi:shield-check-outline' },
  { href: '/staking', label: 'Stake & Earn', icon: 'mdi:chart-line' },
  { href: '/agents', label: 'View AI Agents', icon: 'mdi:robot-outline' },
  { href: '/mcp', label: 'Explore MCP', icon: 'mdi:api' },
  { href: '/x402', label: 'Try x402', icon: 'mdi:cash-lock' },
  { href: '/audit', label: 'Audit Trail', icon: 'mdi:history' },
]

function QuickActions(): ReactElement {
  return (
    <Paper sx={{ p: meridianTokens.spacing.panelPadding, mb: meridianTokens.spacing.sectionGap }}>
      <Typography
        variant="caption"
        color="text.disabled"
        sx={{ letterSpacing: '0.1em', textTransform: 'uppercase', mb: 1.5, display: 'block' }}
      >
        Quick actions
      </Typography>
      <Stack direction="row" gap={1.25} flexWrap="wrap">
        {QUICK_ACTIONS.map((action) => (
          <Button
            key={action.href}
            component={Link}
            href={action.href}
            variant="outlined"
            color="inherit"
            size="small"
            startIcon={<IconifyIcon icon={action.icon} width={16} height={16} />}
            sx={{ borderColor: 'divider', color: 'text.primary' }}
          >
            {action.label}
          </Button>
        ))}
      </Stack>
    </Paper>
  )
}

function DashboardHero(): ReactElement {
  const { data, isLoading, error } = useReady()
  const status = typeof data?.status === 'string' ? data.status : isLoading ? 'checking' : 'unknown'
  const checks = data?.checks as Record<string, { ok?: boolean; detail?: string }> | undefined
  const indexerLag = checks?.indexer_lag?.detail

  return (
    <PageHeader
      icon="mdi:view-dashboard-outline"
      eyebrow="Control Center"
      title="Live RWA operations on Casper testnet"
      description="Monitor indexed contract events, AI agent decisions, compliance state, yield metrics, MCP transaction builders, and x402 payment readiness from one dashboard."
      actions={
        <Stack direction="row" gap={1} flexWrap="wrap" justifyContent="flex-end">
          <Chip color={status === 'ok' ? 'success' : 'warning'} label={`Backend ${status}`} />
          <Chip variant="outlined" label="Casper testnet" />
          <Chip variant="outlined" label="CSPR.click wallet" />
          {error ? <Chip color="error" variant="outlined" label="Backend retrying" /> : null}
          {indexerLag ? (
            <Chip color="warning" variant="outlined" label={`Indexer lag ${indexerLag}`} />
          ) : null}
        </Stack>
      }
    />
  )
}

const Dashboard = (): ReactElement => {
  return (
    <>
      <DashboardHero />
      <QuickActions />
      <Box display="grid" gridTemplateColumns="repeat(12, 1fr)" gap={meridianTokens.spacing.sectionGap}>
        <Box gridColumn={{ xs: 'span 12', '2xl': 'span 8' }} order={{ xs: 0 }}>
          <TodaysSales />
        </Box>
        <Box gridColumn={{ xs: 'span 12', lg: 'span 4' }} order={{ xs: 1, '2xl': 1 }}>
          <Level />
        </Box>
        <Box gridColumn={{ xs: 'span 12', lg: 'span 8' }} order={{ xs: 2, '2xl': 2 }}>
          <TopProducts />
        </Box>
        <Box
          gridColumn={{ xs: 'span 12', md: 'span 6', xl: 'span 4' }}
          order={{ xs: 3, xl: 3, '2xl': 3 }}
        >
          <CustomerFulfillment />
        </Box>
        <Box
          gridColumn={{ xs: 'span 12', md: 'span 6', xl: 'span 4' }}
          order={{ xs: 4, xl: 5, '2xl': 4 }}
        >
          <Earnings />
        </Box>
        <Box gridColumn={{ xs: 'span 12', xl: 'span 8' }} order={{ xs: 5, xl: 4, '2xl': 5 }}>
          <VisitorInsights />
        </Box>
        <Box
          gridColumn={{ xs: 'span 12', xl: 'span 8', '2xl': 'span 6' }}
          order={{ xs: 6, '2xl': 6 }}
        >
          <TrendingNow />
        </Box>
        <Box gridColumn={{ xs: 'span 12', '2xl': 'span 6' }} order={{ xs: 7 }}>
          <Customers />
        </Box>
      </Box>
    </>
  )
}

export default Dashboard
