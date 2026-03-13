import { ReactElement } from 'react';
import { Box } from '@mui/material';
import StakingPanel from '@/dashboard/components/StakingPanel';
import YieldChart from '@/components/YieldChart';
import Earnings from '@/nickelfox/components/sections/dashboard/earnings/Earnings';

export default function StakingPage(): ReactElement {
  return (
    <Box display="grid" gridTemplateColumns="repeat(12, 1fr)" gap={3.5}>
      <Box gridColumn={{ xs: 'span 12', lg: 'span 5' }}>
        <StakingPanel />
      </Box>
      <Box gridColumn={{ xs: 'span 12', md: 'span 6', lg: 'span 4' }}>
        <Earnings />
      </Box>
      <Box gridColumn={{ xs: 'span 12', lg: 'span 7' }}>
        <YieldChart title="Staking Yield History" />
      </Box>
    </Box>
  );
}
