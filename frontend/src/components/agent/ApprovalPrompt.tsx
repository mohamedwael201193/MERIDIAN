'use client'

import { ReactElement } from 'react'
import { Box, Button, Stack, Typography, keyframes } from '@mui/material'
import TransactionReviewCard from '@/components/TransactionReviewCard'
import type { UnsignedTransaction } from '@lib/types'

const glow = keyframes`
  0%, 100% { box-shadow: 0 0 0 0 rgba(229, 57, 53, 0.3); }
  50% { box-shadow: 0 0 24px 4px rgba(229, 57, 53, 0.15); }
`

interface ApprovalPromptProps {
  title?: string
  description?: string
  transaction: UnsignedTransaction
  loading: boolean
  onApprove: () => void
}

export default function ApprovalPrompt({
  title = 'Your wallet approval is needed',
  description = 'Review the transaction below. Nothing happens until you approve in Casper Wallet.',
  transaction,
  loading,
  onApprove,
}: ApprovalPromptProps): ReactElement {
  return (
    <Box
      sx={{
        mb: 2,
        p: 3,
        borderRadius: 4,
        bgcolor: 'rgba(255,255,255,0.04)',
        border: '1px solid',
        borderColor: 'primary.dark',
        animation: `${glow} 2.5s ease-in-out infinite`,
      }}
    >
      <Typography variant="h6" color="common.white" mb={0.5}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>
        {description}
      </Typography>
      <TransactionReviewCard
        transaction={transaction}
        loading={loading}
        txHash={null}
        onSignAndSubmit={onApprove}
      />
    </Box>
  )
}

export function SuccessBanner({
  title = 'Finality verified',
  subtitle,
  explorerHref,
}: {
  title?: string
  subtitle?: string
  explorerHref?: string
}): ReactElement {
  return (
    <Box
      sx={{
        mb: 2,
        p: 3,
        borderRadius: 4,
        bgcolor: 'rgba(46, 125, 50, 0.12)',
        border: '1px solid',
        borderColor: 'success.dark',
        animation: 'fadeUp 0.5s ease-out',
        '@keyframes fadeUp': {
          from: { opacity: 0, transform: 'scale(0.98)' },
          to: { opacity: 1, transform: 'scale(1)' },
        },
      }}
    >
      <Stack direction="row" gap={1.5} alignItems="center" mb={subtitle ? 1 : 0}>
        <Typography fontSize={28}>✓</Typography>
        <Typography variant="h6" color="success.light">
          {title}
        </Typography>
      </Stack>
      {subtitle ? (
        <Typography variant="body2" color="text.secondary" mb={explorerHref ? 1.5 : 0}>
          {subtitle}
        </Typography>
      ) : null}
      {explorerHref ? (
        <Button
          href={explorerHref}
          target="_blank"
          rel="noreferrer"
          variant="outlined"
          color="success"
          size="small"
          sx={{ borderRadius: 3, textTransform: 'none' }}
        >
          View on explorer
        </Button>
      ) : null}
    </Box>
  )
}
