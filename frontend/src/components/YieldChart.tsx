'use client';

import { ReactElement, useEffect, useMemo, useRef } from 'react';
import { Box, Button, Paper, Stack, Typography, CircularProgress } from '@mui/material';
import EChartsReactCore from 'echarts-for-react/lib/core';
import VisitorInsightsChart from '@/nickelfox/components/sections/dashboard/visitor-insights/VisitorInsightsChart';
import { useYieldHistory } from '@lib/hooks/useMeridianData';

interface YieldChartProps {
  limit?: number;
  title?: string;
}

export default function YieldChart({
  limit = 12,
  title = 'Yield History',
}: YieldChartProps): ReactElement {
  const chartRef = useRef<EChartsReactCore | null>(null);
  const { data: history, isLoading } = useYieldHistory(limit);

  const chartData = useMemo(
    () => ({
      'New Visitors': (history ?? []).map(item => Number(item.totalRewards) / 1_000_000_000),
    }),
    [history],
  );

  useEffect(() => {
    const handleResize = () => chartRef.current?.getEchartsInstance().resize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <Paper sx={{ p: { xs: 4, sm: 8 }, height: 1 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" color="common.white">
          {title}
        </Typography>
        <Button variant="text" disableRipple sx={{ color: 'text.disabled', cursor: 'default' }}>
          Live indexed eras
        </Button>
      </Stack>
      {isLoading ? (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress color="primary" />
        </Box>
      ) : (history ?? []).length === 0 ? (
        <Typography color="text.secondary">No yield history indexed yet.</Typography>
      ) : (
        <VisitorInsightsChart
          chartRef={chartRef}
          data={chartData}
          sx={{ height: '342px !important', flexGrow: 1 }}
        />
      )}
    </Paper>
  );
}
