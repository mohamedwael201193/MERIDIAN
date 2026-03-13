'use client';

import { ReactElement, useCallback, useEffect, useMemo, useRef } from 'react';
import { Box, Button, Divider, Paper, Stack, Typography, alpha, useTheme, CircularProgress } from '@mui/material';
import EChartsReactCore from 'echarts-for-react/lib/core';
import CustomerFulfillmentChart from './CustomerFulfillmentChart';
import { useHolders } from '@lib/hooks/useMeridianData';
import type { HolderRow } from '@lib/types';

function isCompliant(holder: HolderRow): boolean {
  return holder.status === 'registered' && holder.sanctions_cleared;
}

function complianceRateAt(holders: HolderRow[], dayEnd: Date): number {
  const cutoff = dayEnd.getTime();
  const active = holders.filter(holder => {
    if (!holder.registered_at) return false;
    return new Date(holder.registered_at).getTime() <= cutoff;
  });
  if (!active.length) return 0;
  return Math.round((active.filter(isCompliant).length / active.length) * 100);
}

function buildSeries(holders: HolderRow[], offsetMonths: number): number[] {
  const points: number[] = [];
  const anchor = new Date();
  anchor.setMonth(anchor.getMonth() - offsetMonths);

  for (let i = 6; i >= 0; i -= 1) {
    const day = new Date(anchor);
    day.setDate(day.getDate() - i);
    day.setHours(23, 59, 59, 999);
    points.push(complianceRateAt(holders, day));
  }
  return points;
}

const CustomerFulfillment = (): ReactElement => {
  const theme = useTheme();
  const chartRef = useRef<EChartsReactCore | null>(null);
  const { data: holders, isLoading } = useHolders(500);

  const chartData = useMemo(() => {
    if (!holders?.length) {
      return { 'This Month': [0, 0, 0, 0, 0, 0, 0], 'Last Month': [0, 0, 0, 0, 0, 0, 0] };
    }
    return {
      'This Month': buildSeries(holders, 0),
      'Last Month': buildSeries(holders, 1),
    };
  }, [holders]);

  useEffect(() => {
    const handleResize = () => {
      chartRef.current?.getEchartsInstance().resize();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getAverageRate = useCallback((values: number[]) => {
    if (!values.length) return '0%';
    const avg = values.reduce((sum, value) => sum + value, 0) / values.length;
    return `${avg.toFixed(1)}%`;
  }, []);

  return (
    <Paper sx={{ p: { xs: 4, sm: 8 }, height: 1 }}>
      <Typography variant="h4" color="common.white">
        Compliance Rate
      </Typography>
      {isLoading ? (
        <Stack alignItems="center" justifyContent="center" sx={{ minHeight: 220 }}>
          <CircularProgress size={28} />
        </Stack>
      ) : (
        <CustomerFulfillmentChart
          chartRef={chartRef}
          sx={{ height: '220px !important', flexGrow: 1 }}
          data={chartData}
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
        <Stack gap={1.25} alignItems="center">
          <Button
            variant="text"
            sx={{
              p: 0.5,
              borderRadius: 1,
              fontSize: 'body2.fontSize',
              color: 'text.disabled',
              '&:hover': { bgcolor: 'transparent' },
              '& .MuiButton-startIcon': { mx: 0, mr: 1 },
            }}
            disableRipple
            startIcon={
              <Box sx={{ width: 6, height: 6, bgcolor: 'secondary.main', borderRadius: 400 }} />
            }
          >
            This Month
          </Button>
          <Typography variant="body2" color="common.white">
            {getAverageRate(chartData['This Month'])}
          </Typography>
        </Stack>
        <Stack gap={1.25} alignItems="center">
          <Button
            variant="text"
            sx={{
              p: 0.5,
              borderRadius: 1,
              fontSize: 'body2.fontSize',
              color: 'text.disabled',
              '&:hover': { bgcolor: 'transparent' },
              '& .MuiButton-startIcon': { mx: 0, mr: 1 },
            }}
            disableRipple
            startIcon={
              <Box sx={{ width: 6, height: 6, bgcolor: 'primary.main', borderRadius: 400 }} />
            }
          >
            Last Month
          </Button>
          <Typography variant="body2" color="common.white">
            {getAverageRate(chartData['Last Month'])}
          </Typography>
        </Stack>
      </Stack>
    </Paper>
  );
};

export default CustomerFulfillment;
