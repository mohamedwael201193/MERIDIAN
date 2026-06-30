'use client'

import { Box, Button, Paper, Stack, Typography, CircularProgress, Alert } from '@mui/material'
import VisitorInsightsChart from './VisitorInsightsChart'
import { ReactElement, useEffect, useMemo, useRef } from 'react'
import EChartsReactCore from 'echarts-for-react/lib/core'
import { useYieldHistory } from '@lib/hooks/useMeridianData'

const VisitorInsights = (): ReactElement => {
  const chartRef = useRef<EChartsReactCore | null>(null)
  const { data: history, isLoading, error } = useYieldHistory(12)

  const chartData = useMemo(() => {
    const items = history ?? []
    return {
      labels: items.map((item) => `Era ${item.eraId ?? '—'}`),
      values: items.map((item) => Number(item.totalRewards) / 1_000_000_000),
      seriesName: 'Era Rewards (CSPR)',
    }
  }, [history])

  useEffect(() => {
    const handleResize = () => chartRef.current?.getEchartsInstance().resize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <Paper sx={{ p: { xs: 4, sm: 8 }, height: 1 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        flexWrap="wrap"
        gap={2}
        mb={6}
      >
        <Box>
          <Typography variant="h4" color="common.white">
            Staking Activity
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Indexed yield rewards from YieldDistributor
          </Typography>
        </Box>
        <Button variant="text" disableRipple sx={{ color: 'text.disabled', cursor: 'default' }}>
          Era rewards (CSPR)
        </Button>
      </Stack>
      {error ? (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Could not load yield history.
        </Alert>
      ) : null}
      {isLoading ? (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress color="primary" />
        </Box>
      ) : chartData.values.length === 0 ? (
        <Typography color="text.secondary" py={6}>
          No yield history indexed yet.
        </Typography>
      ) : (
        <VisitorInsightsChart
          chartRef={chartRef}
          data={chartData}
          sx={{ height: '342px !important', flexGrow: 1 }}
        />
      )}
    </Paper>
  )
}

export default VisitorInsights
