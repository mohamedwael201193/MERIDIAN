'use client';

import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Typography,
  Link as MuiLink,
} from '@mui/material';
import { pollTransactionStatus, type TxPollStatus } from '@lib/transactions';
import { explorerTxUrl, truncateHash } from '@lib/contracts';

interface TransactionStatusProps {
  transactionHash: string | null;
  onFinalized?: () => void;
}

export default function TransactionStatus({ transactionHash, onFinalized }: TransactionStatusProps) {
  const [status, setStatus] = useState<TxPollStatus>('pending');
  const [detail, setDetail] = useState<string | undefined>();

  useEffect(() => {
    if (!transactionHash) return;

    let cancelled = false;
    setStatus('pending');
    setDetail(undefined);

    void (async () => {
      const result = await pollTransactionStatus(transactionHash);
      if (cancelled) return;
      setStatus(result.status);
      setDetail(result.detail);
      if (result.status === 'finalized' || result.status === 'processed') {
        onFinalized?.();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [transactionHash, onFinalized]);

  if (!transactionHash) return null;

  const severity = status === 'failed' ? 'error' : status === 'finalized' ? 'success' : 'info';
  const chipColor = status === 'failed' ? 'error' : status === 'finalized' ? 'success' : 'info';

  return (
    <Paper variant="outlined" sx={{ mt: 2, p: 2.5, bgcolor: 'background.default', borderColor: 'divider' }}>
      <Stack gap={2}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={1.5}>
          <Box>
            <Typography variant="h6" color="common.white">
              Transaction Status
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Submitted to Casper testnet and being checked for finality.
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
          <MuiLink href={explorerTxUrl(transactionHash)} target="_blank" rel="noreferrer" variant="body2">
            {truncateHash(transactionHash, 12, 10)}
          </MuiLink>
        </Stack>
      </Stack>
    </Paper>
  );
}
