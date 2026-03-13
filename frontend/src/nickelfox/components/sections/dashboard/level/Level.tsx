'use client';

import { Box, Button, Divider, Paper, Stack, Typography, alpha, useTheme, CircularProgress } from '@mui/material';
import EChartsReactCore from 'echarts-for-react/lib/core';
import { ReactElement, useEffect, useMemo, useRef } from 'react';
import LevelChart from './LevelChart';
import { useDecisions } from '@lib/hooks/useMeridianData';

const Level = (): ReactElement => {
  const theme = useTheme();
  const chartRef = useRef<EChartsReactCore | null>(null);
  const { data: decisions, isLoading } = useDecisions(100);

  const levelData = useMemo(() => {
    const buckets = [0, 0, 0, 0, 0, 0];
    (decisions ?? []).forEach((decision, index) => {
      buckets[index % buckets.length] += decision.approved === false ? 0 : 1;
    });
    return {
      Volume: buckets,
      Service: buckets.map(v => Math.max(0, v - 1)),
    };
  }, [decisions]);

  useEffect(() => {
    const handleResize = () => chartRef.current?.getEchartsInstance().resize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <Paper sx={{ p: { xs: 4, sm: 8 }, height: 1 }}>
      <Typography variant="h4" color="common.white">
        Agent Activity
      </Typography>
      {isLoading ? (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress color="primary" />
        </Box>
      ) : (
        <LevelChart chartRef={chartRef} data={levelData} sx={{ height: '181px !important', flexGrow: 1 }} />
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
          {(decisions ?? []).filter(d => d.agent_name.includes('yield')).length} yield decisions
        </Button>
        <Button variant="text" disableRipple sx={{ color: 'text.disabled' }}>
          {(decisions ?? []).filter(d => d.agent_name.includes('audit')).length} audit decisions
        </Button>
      </Stack>
    </Paper>
  );
};

export default Level;
