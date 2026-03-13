'use client';

import { ReactElement } from 'react';
import { Box, Chip, Paper, Stack, Typography } from '@mui/material';
import SaleCard from '@/nickelfox/components/sections/dashboard/todays-sales/SaleCard';
import { useProtocolKpis } from '@lib/hooks/useMeridianData';
import { formatApy, formatMotes } from '@lib/contracts';

const TodaysSales = (): ReactElement => {
  const { isLoading, error, kpis } = useProtocolKpis();

  const salesData = [
    {
      id: 1,
      icon: 'mdi:currency-usd',
      title: isLoading ? '…' : formatMotes(kpis.totalStaked),
      subtitle: 'CSPR Staked',
      increment: 0,
      color: 'primary.main',
    },
    {
      id: 2,
      icon: 'mdi:percent-outline',
      title: isLoading ? '…' : formatApy(kpis.estimatedApyBps),
      subtitle: 'Estimated APY',
      increment: 0,
      color: 'error.main',
    },
    {
      id: 3,
      icon: 'mdi:shield-check',
      title: isLoading ? '…' : String(kpis.compliantHolders),
      subtitle: 'Compliant Holders',
      increment: 0,
      color: 'success.main',
    },
    {
      id: 4,
      icon: 'mdi:token',
      title: isLoading ? '…' : String(kpis.activeTokens),
      subtitle: 'Active Tokens',
      increment: 0,
      color: 'warning.main',
    },
  ];

  return (
    <Paper sx={{ p: { xs: 3, sm: 4 }, height: 1, border: '1px solid', borderColor: 'divider' }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={2} mb={4}>
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
      <Box display="grid" gridTemplateColumns="repeat(12, 1fr)" gap={{ xs: 4, sm: 6 }}>
        {salesData.map(saleItem => (
          <Box key={saleItem.id} gridColumn={{ xs: 'span 12', sm: 'span 6', lg: 'span 3' }}>
            <SaleCard saleItem={saleItem} />
          </Box>
        ))}
      </Box>
    </Paper>
  );
};

export default TodaysSales;
