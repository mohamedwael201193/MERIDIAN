import { ReactElement } from 'react'
import { Box } from '@mui/material'
import AgentDecisionFeed from '@/dashboard/components/AgentDecisionFeed'
import Level from '@/nickelfox/components/sections/dashboard/level/Level'
import PageHeader from '@/components/PageHeader'

export default function AgentsPage(): ReactElement {
  return (
    <Box display="grid" gridTemplateColumns="repeat(12, 1fr)" gap={3.5}>
      <Box gridColumn={{ xs: 'span 12' }}>
        <PageHeader
          icon="mdi:robot-outline"
          eyebrow="Intelligence"
          title="AI Agents"
          stepLabel="Step 5 of 8"
          description="Autonomous yield, compliance, and audit agents monitor MERIDIAN continuously. Every approval or rejection is logged with its reasoning and confidence."
        />
      </Box>
      <Box gridColumn={{ xs: 'span 12', lg: 'span 5' }}>
        <Level />
      </Box>
      <Box gridColumn={{ xs: 'span 12', lg: 'span 7' }}>
        <AgentDecisionFeed />
      </Box>
    </Box>
  )
}
