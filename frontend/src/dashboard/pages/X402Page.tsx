'use client'

import { ReactElement } from 'react'
import { Box, Paper } from '@mui/material'
import X402PaymentFlow from '@/dashboard/components/X402PaymentFlow'
import PageHeader from '@/components/PageHeader'
import { meridianTokens } from '@/design/tokens'

export default function X402Page(): ReactElement {
  return (
    <Box display="grid" gridTemplateColumns="repeat(12, 1fr)" gap={meridianTokens.spacing.sectionGap}>
      <Box gridColumn={{ xs: 'span 12' }}>
        <PageHeader
          icon="mdi:cash-lock"
          eyebrow="Integrations"
          title="x402 Payments"
          stepLabel="Step 7 of 8"
          description="Pay for premium data resources per-request using the x402 protocol — sign a payment, verify it, and unlock the resource in one flow."
        />
      </Box>
      <Box gridColumn={{ xs: 'span 12' }}>
        <Paper sx={{ p: { xs: 4, sm: 6 } }}>
          <X402PaymentFlow />
        </Paper>
      </Box>
    </Box>
  )
}
