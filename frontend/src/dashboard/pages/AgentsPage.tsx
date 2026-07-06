'use client'

import { ReactElement } from 'react'
import { Box } from '@mui/material'
import AgentActivityCenter from '@/dashboard/components/AgentActivityCenter'
import PageHeader from '@/components/PageHeader'

export default function AgentsPage(): ReactElement {
  return (
    <Box>
      <PageHeader
        icon="mdi:robot-outline"
        eyebrow="Agent-First Protocol"
        title="Agent Activity Center"
        stepLabel="Primary visualizer"
        description="Claude, Cursor, and the Planner Agent drive MERIDIAN through MCP. This page streams live reasoning, tool calls, wallet steps, and indexer updates."
      />
      <AgentActivityCenter />
    </Box>
  )
}
