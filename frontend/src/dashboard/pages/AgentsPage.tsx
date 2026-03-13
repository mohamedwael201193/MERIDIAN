import { ReactElement } from 'react';
import { Box } from '@mui/material';
import AgentDecisionFeed from '@/dashboard/components/AgentDecisionFeed';
import Level from '@/nickelfox/components/sections/dashboard/level/Level';

export default function AgentsPage(): ReactElement {
  return (
    <Box display="grid" gridTemplateColumns="repeat(12, 1fr)" gap={3.5}>
      <Box gridColumn={{ xs: 'span 12', lg: 'span 5' }}>
        <Level />
      </Box>
      <Box gridColumn={{ xs: 'span 12', lg: 'span 7' }}>
        <AgentDecisionFeed />
      </Box>
    </Box>
  );
}
