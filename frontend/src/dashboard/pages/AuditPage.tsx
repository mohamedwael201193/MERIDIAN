import { ReactElement } from 'react'
import { Box } from '@mui/material'
import AuditTrail from '@/dashboard/components/AuditTrail'
import AgentDecisionFeed from '@/dashboard/components/AgentDecisionFeed'
import YieldChart from '@/components/YieldChart'
import PageHeader from '@/components/PageHeader'
import { meridianTokens } from '@/design/tokens'

export default function AuditPage(): ReactElement {
  return (
    <Box display="grid" gridTemplateColumns="repeat(12, 1fr)" gap={meridianTokens.spacing.sectionGap}>
      <Box gridColumn={{ xs: 'span 12' }}>
        <PageHeader
          icon="mdi:history"
          eyebrow="Intelligence"
          title="Audit Trail"
          stepLabel="Step 8 of 8"
          description="Every indexed contract event and agent decision, in order. Use this as the final source of truth for what happened on-chain and why."
        />
      </Box>
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
  )
}
