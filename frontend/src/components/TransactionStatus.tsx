'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Typography,
  Link as MuiLink,
} from '@mui/material'
import { pollTransactionStatus, type TxPollStatus } from '@lib/transactions'
import { explorerTxUrl, truncateHash } from '@lib/contracts'

interface TransactionStatusProps {
  transactionHash: string | null
  onFinalized?: () => void
  onStatusChange?: (status: TxPollStatus, detail?: string) => void
}

export default function TransactionStatus({
  transactionHash,
  onFinalized,
  onStatusChange,
}: TransactionStatusProps) {
  const [status, setStatus] = useState<TxPollStatus>('pending')
  const [detail, setDetail] = useState<string | undefined>()
  const notifiedHashRef = useRef<string | null>(null)
  const onFinalizedRef = useRef(onFinalized)
  const onStatusChangeRef = useRef(onStatusChange)
  onFinalizedRef.current = onFinalized
  onStatusChangeRef.current = onStatusChange

  useEffect(() => {
    if (!transactionHash) return
    if (notifiedHashRef.current === transactionHash) return

    let cancelled = false
    setStatus('pending')
    setDetail(undefined)

    void (async () => {
      const result = await pollTransactionStatus(transactionHash)
      if (cancelled) return
      setStatus(result.status)
      setDetail(result.detail)
      onStatusChangeRef.current?.(result.status, result.detail)
      if (result.status === 'finalized' || result.status === 'processed') {
        if (notifiedHashRef.current === transactionHash) return
        notifiedHashRef.current = transactionHash
        onFinalizedRef.current?.()
      }
    })()

    return () => {
      cancelled = true
    }
  }, [transactionHash])

  if (!transactionHash) return null

  const severity = status === 'failed' ? 'error' : status === 'finalized' ? 'success' : 'info'
  const chipColor = status === 'failed' ? 'error' : status === 'finalized' ? 'success' : 'info'

  return (
    <Paper
      variant="outlined"
      sx={{ mt: 2, p: 2.5, bgcolor: 'background.default', borderColor: 'divider' }}
    >
      <Stack gap={2}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={1.5}>
          <Box>
            <Typography variant="h6" color="common.white">
              Transaction Status
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {status === 'failed'
                ? 'The transaction was included on-chain but execution failed.'
                : status === 'finalized'
                  ? 'Transaction reached finality on Casper testnet.'
                  : 'Submitted to Casper testnet and being checked for finality.'}
            </Typography>
          </Box>
          <Stack direction="row" gap={1} alignItems="center">
            {(status === 'pending' || status === 'processed') && <CircularProgress size={16} />}
            <Chip color={chipColor} label={status} />
          </Stack>
        </Stack>

        {detail ? <Alert severity={severity}>{detail}</Alert> : null}

        <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap">
          <Typography variant="caption" color="text.secondary">
            Hash
          </Typography>
          <MuiLink
            href={explorerTxUrl(transactionHash)}
            target="_blank"
            rel="noreferrer"
            variant="body2"
          >
            {truncateHash(transactionHash, 12, 10)}
          </MuiLink>
        </Stack>
      </Stack>
    </Paper>
  )
}
