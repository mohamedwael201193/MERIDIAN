'use client'

import { ReactElement } from 'react'
import { Alert, Box, Button, Chip, Paper, Stack, Typography } from '@mui/material'
import type { UnsignedTransaction } from '@lib/types'
import { explorerTxUrl } from '@lib/contracts'

interface TransactionReviewCardProps {
  transaction: UnsignedTransaction
  title?: string
  description?: string
  loading?: boolean
  txHash?: string | null
  onSignAndSubmit: () => void | Promise<void>
}

function transactionSize(transaction: unknown): string {
  try {
    const bytes = new Blob([JSON.stringify(transaction)]).size
    if (bytes < 1024) return `${bytes} B`
    return `${(bytes / 1024).toFixed(1)} KB`
  } catch {
    return 'Unknown'
  }
}

export default function TransactionReviewCard({
  transaction,
  title = 'Transaction Ready',
  description = 'Review this unsigned TransactionV1, then approve it in your wallet.',
  loading = false,
  txHash = null,
  onSignAndSubmit,
}: TransactionReviewCardProps): ReactElement {
  const explorerBase = transaction.explorerHint ?? 'https://testnet.cspr.live'

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2.5,
        bgcolor: 'background.default',
        borderColor: 'error.main',
        boxShadow: '0 0 0 1px rgba(239, 68, 68, 0.12)',
      }}
    >
      <Stack gap={2}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={2}>
          <Box>
            <Typography variant="h6" color="common.white">
              {title}
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              {description}
            </Typography>
          </Box>
          <Chip color="error" label="Wallet signature required" />
        </Stack>

        <Alert severity="warning" sx={{ alignItems: 'flex-start' }}>
          <Typography variant="subtitle2" fontWeight={700}>
            Why signing is required
          </Typography>
          <Typography variant="body2">{transaction.note}</Typography>
        </Alert>

        {transaction.expectedResult ? (
          <Alert severity="info">
            <Typography variant="subtitle2" fontWeight={700}>
              Expected result
            </Typography>
            <Typography variant="body2">{transaction.expectedResult}</Typography>
          </Alert>
        ) : null}

        <Stack direction="row" gap={1} flexWrap="wrap">
          <Chip size="small" label={transaction.transactionType || 'TransactionV1'} />
          <Chip size="small" variant="outlined" label={`Network ${transaction.network}`} />
          <Chip size="small" variant="outlined" label={`Chain ${transaction.chainName}`} />
          <Chip size="small" variant="outlined" label={`Payload ${transactionSize(transaction.transaction)}`} />
          {transaction.requiredRole ? (
            <Chip size="small" color="warning" label={`Role: ${transaction.requiredRole}`} />
          ) : null}
          {transaction.attachedValueMotes ? (
            <Chip
              size="small"
              color="primary"
              label={`Attach ${transaction.attachedValueMotes} motes`}
            />
          ) : null}
        </Stack>

        <Typography variant="caption" color="text.secondary">
          Explorer: {explorerBase}
          {txHash ? ` · ${explorerTxUrl(txHash)}` : ' · hash appears after broadcast'}
        </Typography>

        <Stack direction={{ xs: 'column', sm: 'row' }} gap={1.5} alignItems={{ sm: 'center' }}>
          <Button
            variant="contained"
            color="error"
            onClick={() => void onSignAndSubmit()}
            disabled={loading}
          >
            Sign & Submit with Wallet
          </Button>
          <Typography variant="caption" color="text.secondary">
            Private keys stay in Casper Wallet. MERIDIAN only receives the signed transaction/hash.
          </Typography>
        </Stack>
      </Stack>
    </Paper>
  )
}
