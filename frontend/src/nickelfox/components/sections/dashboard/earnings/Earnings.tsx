'use client';

import { Box, Paper, Typography, CircularProgress } from '@mui/material';
import EarningsChart from './EarningsChart';
import { ReactElement, useEffect, useRef } from 'react';
import EChartsReactCore from 'echarts-for-react/lib/core';
import { useTokenYield } from '@lib/hooks/useMeridianData';
import { formatApy, formatMotes } from '@lib/contracts';

const Earnings = (): ReactElement => {
  const chartRef = useRef<EChartsReactCore | null>(null);
  const { data: yieldInfo, isLoading } = useTokenYield();

  useEffect(() => {
    const handleResize = () => chartRef.current?.getEchartsInstance().resize({ width: 'auto', height: 'auto' });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const rewards = yieldInfo?.lastDistribution?.total_rewards ?? '0';
  const apy = yieldInfo?.estimatedApyBps ?? 0;
  const gaugeValue = Math.min(100, Math.round(apy / 100));

  return (
    <Paper sx={{ p: { xs: 4, sm: 8 }, height: 1 }}>
      <Typography variant="h4" color="common.white" mb={2.5}>
        Yield Distribution
      </Typography>
      <Typography variant="body1" color="text.primary" mb={4.5}>
        Total CSPR Rewards
      </Typography>
      {isLoading ? (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress color="primary" />
        </Box>
      ) : (
        <>
          <Typography variant="h1" color="primary.main" mb={4.5} fontSize={{ xs: 'h2.fontSize', sm: 'h1.fontSize' }}>
            {formatMotes(rewards)} CSPR
          </Typography>
          <Typography variant="body1" color="text.primary" mb={15}>
            APY is {formatApy(apy)} — indexed from YieldDistributor
          </Typography>
          <Box flex={1} sx={{ position: 'relative' }}>
            <EarningsChart chartRef={chartRef} value={gaugeValue} sx={{ display: 'flex', justifyContent: 'center', flex: '1 1 0%', maxHeight: 152 }} />
            <Typography variant="h1" color="common.white" textAlign="center" mx="auto" position="absolute" left={0} right={0} bottom={0}>
              {gaugeValue}%
            </Typography>
          </Box>
        </>
      )}
    </Paper>
  );
};

export default Earnings;
