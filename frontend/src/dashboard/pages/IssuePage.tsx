'use client'

import { ReactElement } from 'react'
import { Box, Paper } from '@mui/material'
import TokenIssueForm from '@/dashboard/components/TokenIssueForm'
import PageHeader from '@/components/PageHeader'

export default function IssuePage(): ReactElement {
  return (
    <Box display="grid" gridTemplateColumns="repeat(12, 1fr)" gap={3.5}>
      <Box gridColumn={{ xs: 'span 12' }}>
        <PageHeader
          icon="mdi:token"
          eyebrow="Assets"
          title="Issue Token"
          stepLabel="Step 2 of 8"
          description="Create a new compliant RWA token on Casper testnet. MERIDIAN's MCP server builds the transaction — you review and sign it with your wallet."
        />
      </Box>
      <Box gridColumn={{ xs: 'span 12', lg: 'span 8' }}>
        <Paper sx={{ p: { xs: 4, sm: 6 }, border: '1px solid', borderColor: 'divider' }}>
          <TokenIssueForm />
        </Paper>
      </Box>
      <Box gridColumn={{ xs: 'span 12', lg: 'span 4' }}>
        <Paper
          sx={{
            p: { xs: 3, sm: 4 },
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.default',
            height: 1,
          }}
        >
          <Box
            component="ol"
            sx={{ pl: 2.5, m: 0, color: 'text.secondary', '& li': { mb: 1.5, fontSize: 14 } }}
          >
            <li>MCP builds an unsigned issuance transaction from your symbol and supply.</li>
            <li>Review the transaction summary — network, payload size, method.</li>
            <li>Sign and submit with Casper Wallet. Keys never leave your device.</li>
            <li>Track finalization, then find your token on the Dashboard and Compliance pages.</li>
          </Box>
        </Paper>
      </Box>
    </Box>
  )
}
