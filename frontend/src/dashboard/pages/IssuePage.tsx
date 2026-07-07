'use client'

import { ReactElement } from 'react'
import { Box, Paper } from '@mui/material'
import TokenIssueForm from '@/dashboard/components/TokenIssueForm'
import PageHeader from '@/components/PageHeader'
import { meridianTokens } from '@/design/tokens'

export default function IssuePage(): ReactElement {
  return (
    <Box display="grid" gridTemplateColumns="repeat(12, 1fr)" gap={meridianTokens.spacing.sectionGap}>
      <Box gridColumn={{ xs: 'span 12' }}>
        <PageHeader
          icon="mdi:token"
          eyebrow="Assets"
          title="Token contract"
          stepLabel="Step 2 of 8"
          description="MRWA is already deployed on Casper testnet. This page shows the fixed-supply contract status and blocks invalid mint flows."
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
            <li>The token was issued during MeridianToken deployment.</li>
            <li>No public mint or issue entrypoint exists on the deployed package.</li>
            <li>Executable write actions are Transfer Token, Stake, Vault Deposit, Restake, Register, Revoke, and Distribute Rewards.</li>
            <li>If token issuance is required, deploy a new contract version with a real owner-gated entrypoint first.</li>
          </Box>
        </Paper>
      </Box>
    </Box>
  )
}
