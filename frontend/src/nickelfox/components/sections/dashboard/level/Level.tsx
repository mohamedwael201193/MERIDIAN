'use client'

import {
  Box,
  Divider,
  Paper,
  Stack,
  Typography,
  alpha,
  useTheme,
  CircularProgress,
  Alert,
} from '@mui/material'
import EChartsReactCore from 'echarts-for-react/lib/core'
import { ReactElement, useEffect, useMemo, useRef } from 'react'
import LevelChart from './LevelChart'
import { useDecisions } from '@lib/hooks/useMeridianData'
import { meridianTokens } from '@/design/tokens'

const AGENT_BUCKETS = [
  { key: 'yield', label: 'Yield' },
  { key: 'audit', label: 'Audit' },
  { key: 'compliance', label: 'Compliance' },
] as const

function countByAgent(decisions: { agent_name: string }[], key: string): number {
  return decisions.filter((d) => d.agent_name.toLowerCase().includes(key)).length
}

const Level = (): ReactElement => {
  const theme = useTheme()
  const chartRef = useRef<EChartsReactCore | null>(null)
  const { data: decisions, isLoading, error } = useDecisions(100)
  const rows = decisions ?? []

  const levelData = useMemo(() => {
    const approved = AGENT_BUCKETS.map(
      ({ key }) =>
        rows.filter(
          (decision) =>
            decision.agent_name.toLowerCase().includes(key) && decision.approved !== false,
        ).length,
    )
    const rejected = AGENT_BUCKETS.map(
      ({ key }) =>
        rows.filter(
          (decision) =>
            decision.agent_name.toLowerCase().includes(key) && decision.approved === false,
        ).length,
    )
    return {
      labels: AGENT_BUCKETS.map((bucket) => bucket.label),
      Volume: approved,
      Service: rejected,
    }
  }, [rows])

  useEffect(() => {
    const handleResize = () => chartRef.current?.getEchartsInstance().resize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const stats = AGENT_BUCKETS.map(({ key, label }) => ({
    label,
    count: countByAgent(rows, key),
  }))

  return (
    <Paper sx={{ p: meridianTokens.spacing.panelPadding, height: 1, display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h5" color="common.white" fontWeight={600}>
        Agent Activity
      </Typography>
      <Typography variant="body2" color="text.secondary" mt={0.5} mb={2.5}>
        Approved vs rejected decisions by agent type
      </Typography>
      {error ? (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Could not load agent decisions.
        </Alert>
      ) : null}
      {isLoading ? (
        <Box display="flex" justifyContent="center" py={8} flex={1}>
          <CircularProgress color="primary" />
        </Box>
      ) : rows.length === 0 ? (
        <Typography color="text.secondary" py={6} flex={1}>
          No indexed agent decisions yet.
        </Typography>
      ) : (
        <Box flex={1} minHeight={200}>
          <LevelChart
            chartRef={chartRef}
            data={levelData}
            sx={{ height: '100% !important', minHeight: 200 }}
          />
        </Box>
      )}
      <Stack
        direction="row"
        justifyContent="space-around"
        divider={
          <Divider
            orientation="vertical"
            flexItem
            sx={{ borderColor: alpha(theme.palette.common.white, 0.08) }}
          />
        }
        pt={2.5}
        mt={1}
      >
        {stats.map((stat) => (
          <Typography key={stat.label} variant="caption" color="text.disabled" textAlign="center">
            {String(stat.count)} {stat.label.toLowerCase()} decisions
          </Typography>
        ))}
      </Stack>
    </Paper>
  )
}

export default Level
