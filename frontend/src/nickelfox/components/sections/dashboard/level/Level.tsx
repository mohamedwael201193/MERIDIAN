'use client'

import {
  Box,
  Button,
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

const AGENT_BUCKETS = [
  { key: 'yield', label: 'Yield' },
  { key: 'audit', label: 'Audit' },
  { key: 'compliance', label: 'Compliance' },
] as const

const Level = (): ReactElement => {
  const theme = useTheme()
  const chartRef = useRef<EChartsReactCore | null>(null)
  const { data: decisions, isLoading, error } = useDecisions(100)

  const levelData = useMemo(() => {
    const approved = AGENT_BUCKETS.map(
      ({ key }) =>
        (decisions ?? []).filter(
          (decision) =>
            decision.agent_name.toLowerCase().includes(key) && decision.approved !== false,
        ).length,
    )
    const rejected = AGENT_BUCKETS.map(
      ({ key }) =>
        (decisions ?? []).filter(
          (decision) =>
            decision.agent_name.toLowerCase().includes(key) && decision.approved === false,
        ).length,
    )
    return {
      labels: AGENT_BUCKETS.map((bucket) => bucket.label),
      Volume: approved,
      Service: rejected,
    }
  }, [decisions])

  useEffect(() => {
    const handleResize = () => chartRef.current?.getEchartsInstance().resize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <Paper sx={{ p: { xs: 4, sm: 8 }, height: 1 }}>
      <Typography variant="h4" color="common.white">
        Agent Activity
      </Typography>
      <Typography variant="body2" color="text.secondary" mt={0.5} mb={2}>
        Approved vs rejected decisions by agent type
      </Typography>
      {error ? (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Could not load agent decisions.
        </Alert>
      ) : null}
      {isLoading ? (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress color="primary" />
        </Box>
      ) : (decisions ?? []).length === 0 ? (
        <Typography color="text.secondary" py={6}>
          No indexed agent decisions yet.
        </Typography>
      ) : (
        <LevelChart
          chartRef={chartRef}
          data={levelData}
          sx={{ height: '181px !important', flexGrow: 1 }}
        />
      )}
      <Stack
        direction="row"
        justifyContent="space-around"
        divider={
          <Divider
            orientation="vertical"
            flexItem
            sx={{ borderColor: alpha(theme.palette.common.white, 0.06), height: 1 }}
          />
        }
        px={2}
        pt={3}
      >
        <Button variant="text" disableRipple sx={{ color: 'text.disabled' }}>
          {(decisions ?? []).filter((d) => d.agent_name.includes('yield')).length} yield decisions
        </Button>
        <Button variant="text" disableRipple sx={{ color: 'text.disabled' }}>
          {(decisions ?? []).filter((d) => d.agent_name.includes('audit')).length} audit decisions
        </Button>
      </Stack>
    </Paper>
  )
}

export default Level
