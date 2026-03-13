import { ReactElement } from 'react';
import { Box } from '@mui/material';
import AuditTrail from '@/dashboard/components/AuditTrail';
import AgentDecisionFeed from '@/dashboard/components/AgentDecisionFeed';
import YieldChart from '@/components/YieldChart';

export default function AuditPage(): ReactElement {
  return (
    <Box display="grid" gridTemplateColumns="repeat(12, 1fr)" gap={3.5}>
      <Box gridColumn={{ xs: 'span 12', xl: 'span 7' }}>
        <AuditTrail />
      </Box>
      <Box gridColumn={{ xs: 'span 12', xl: 'span 5' }}>
        <AgentDecisionFeed />
      </Box>
      <Box gridColumn={{ xs: 'span 12' }}>
        <YieldChart title="Yield History" limit={24} />
      </Box>
    </Box>
  );
}
