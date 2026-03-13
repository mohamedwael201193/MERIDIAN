'use client';

import { Box, Button, Paper, Stack, Typography, CircularProgress } from '@mui/material';
import VisitorInsightsChart from './VisitorInsightsChart';
import { ReactElement, useEffect, useMemo, useRef } from 'react';
import EChartsReactCore from 'echarts-for-react/lib/core';
import { useYieldHistory } from '@lib/hooks/useMeridianData';

const VisitorInsights = (): ReactElement => {
  const chartRef = useRef<EChartsReactCore | null>(null);
  const { data: history, isLoading } = useYieldHistory(12);

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
      <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2} mb={6}>
        <Typography variant="h4" color="common.white">
          Staking Activity
        </Typography>
        <Button variant="text" disableRipple sx={{ color: 'text.disabled', cursor: 'default' }}>
          Era rewards (CSPR)
        </Button>
      </Stack>
      {isLoading ? (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress color="primary" />
        </Box>
      ) : (
        <VisitorInsightsChart
          chartRef={chartRef}
          data={chartData}
          sx={{ height: '342px !important', flexGrow: 1 }}
        />
      )}
    </Paper>
  );
};

export default VisitorInsights;
