'use client';

import { useState, ReactElement } from 'react';
import {
  Stack,
  Button,
  Alert,
  MenuItem,
  TextField,
  Box,
  Paper,
  Typography,
  Chip,
  CircularProgress,
} from '@mui/material';
import { MERIDIAN_NETWORK } from '@lib/contracts';
import { meridianApi } from '@lib/api';
import { explorerTxUrl, formatMotes, truncateHash } from '@lib/contracts';
import { useWalletActions } from '@lib/hooks/useWalletActions';
import type { PaymentAccept } from '@lib/x402';
import TransactionStatus from '@/components/TransactionStatus';
import StructuredDataCard from '@/components/StructuredDataCard';

const RESOURCES = [
  { id: 'yield-rate', label: 'Yield Rate' },
  { id: 'validator-performance', label: 'Validator Performance' },
  { id: 'sanctions-merkle', label: 'Sanctions Merkle Root' },
] as const;

interface PaymentRequiredResponse {
  x402Version: number;
  accepts: PaymentAccept[];
}

type X402Step = 'idle' | 'signing' | 'verifying' | 'settling' | 'accessing' | 'complete' | 'failed';

function formatUnknownError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  try {
    return JSON.stringify(error);
  } catch {
    return 'Unknown x402 error';
  }
}

function stepLabel(step: X402Step): string {
  switch (step) {
    case 'signing':
      return 'Waiting for wallet signatures';
    case 'verifying':
      return 'Verifying payment proof';
    case 'settling':
      return 'Settling payment on Casper';
    case 'accessing':
      return 'Unlocking paid resource';
    case 'complete':
      return 'Paid resource unlocked';
    case 'failed':
      return 'x402 flow failed';
    default:
      return 'Ready';
  }
}

export default function X402PaymentFlow(): ReactElement {
  const wallet = useWalletActions();
  const [resource, setResource] = useState<(typeof RESOURCES)[number]['id']>('yield-rate');
  const [paymentRequired, setPaymentRequired] = useState<PaymentRequiredResponse | null>(null);
  const [data, setData] = useState<unknown>(null);
  const [settlementHash, setSettlementHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<X402Step>('idle');
  const [loading, setLoading] = useState(false);

  const requestUnpaid = async () => {
    setError(null);
    setStep('idle');
    setData(null);
    setSettlementHash(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/x402/resource/${resource}`);
      const body = await res.json();
      if (res.status === 402) {
        setPaymentRequired(body as PaymentRequiredResponse);
      } else if (res.ok) {
        setData(body);
      } else {
        setError(body.error?.message ?? 'Request failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  const payAndAccess = async () => {
    if (!(await wallet.getPublicKey())) {
      setError('Connect wallet to sign x402 payment.');
      return;
    }
    const accept = paymentRequired?.accepts?.[0];
    if (!accept) {
      setError('Request the resource first to receive HTTP 402 payment terms.');
      return;
    }
    setLoading(true);
    setError(null);
    setStep('signing');
    try {
      const payment = await wallet.signX402Payment(accept);
      const paymentHeader = JSON.stringify(payment);
      setStep('verifying');
      const verify = await meridianApi.x402Verify(payment, MERIDIAN_NETWORK);
      if (!verify.valid) {
        throw new Error(`Verify failed: ${verify.reason ?? 'payment was not accepted'}`);
      }
      setStep('settling');
      const res = await fetch(`/api/x402/resource/${resource}`, {
        headers: { 'X-Payment': paymentHeader },
      });
      const body = await res.json();
      if (!res.ok) {
        const message =
          typeof body?.error === 'string'
            ? body.error
            : body?.error?.message ?? body?.detail ?? 'Paid request failed';
        throw new Error(`Paid access failed: ${message}`);
      }
      const settlement = typeof body?.settlement === 'string' ? body.settlement : null;
      if (!settlement) {
        throw new Error('Settle failed: paid resource did not return a settlement hash');
      }
      setSettlementHash(settlement);
      setStep('accessing');
      setData(body.data ?? body);
      setPaymentRequired(null);
      setStep('complete');
    } catch (err) {
      setStep('failed');
      setError(formatUnknownError(err));
    } finally {
      setLoading(false);
    }
  };

  const terms = paymentRequired?.accepts?.[0];

  return (
    <Stack gap={3}>
      <TextField select label="Resource" value={resource} onChange={e => setResource(e.target.value as typeof resource)}>
        {RESOURCES.map(item => (
          <MenuItem key={item.id} value={item.id}>
            {item.label}
          </MenuItem>
        ))}
      </TextField>
      <Stack direction="row" gap={2} flexWrap="wrap">
        <Button variant="outlined" onClick={requestUnpaid} disabled={loading}>
          Request (expect 402)
        </Button>
        <Button variant="contained" onClick={payAndAccess} disabled={loading || !paymentRequired}>
          Pay · Verify · Settle · Access
        </Button>
      </Stack>
      {step !== 'idle' ? (
        <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default', borderColor: 'divider' }}>
          <Stack direction="row" gap={1.5} alignItems="center" flexWrap="wrap">
            {loading ? <CircularProgress size={18} /> : null}
            <Chip
              size="small"
              color={step === 'complete' ? 'success' : step === 'failed' ? 'error' : 'info'}
              label={stepLabel(step)}
            />
            <Typography variant="body2" color="text.secondary">
              {step === 'signing'
                ? 'Approve the authorization signature and payment transaction in Casper Wallet.'
                : step === 'failed'
                  ? 'See the error below for the exact failed step.'
                  : 'Do not close the page while this step is running.'}
            </Typography>
          </Stack>
        </Paper>
      ) : null}
      {error ? (
        <Alert severity="error">
          <Typography variant="body2" fontWeight={700}>
            {error}
          </Typography>
          <Typography variant="caption" display="block" mt={0.5}>
            Common causes: wallet rejected one signature, insufficient testnet CSPR for payment/gas,
            invalid signature format, or settlement RPC rejection.
          </Typography>
        </Alert>
      ) : null}
      {terms ? (
        <Paper variant="outlined" sx={{ p: 2.5, bgcolor: 'background.default', borderColor: 'warning.main' }}>
          <Stack gap={2}>
            <Stack direction="row" justifyContent="space-between" gap={2} flexWrap="wrap">
              <Box>
                <Typography variant="h6" color="common.white">
                  Payment Required
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  The resource returned HTTP 402. Pay on Casper testnet to unlock access.
                </Typography>
              </Box>
              <Chip color="warning" label={`${formatMotes(terms.maxAmountRequired)} CSPR`} />
            </Stack>
            <Stack direction="row" gap={1} flexWrap="wrap">
              <Chip size="small" variant="outlined" label={terms.scheme} />
              <Chip size="small" variant="outlined" label={terms.network} />
              <Chip size="small" variant="outlined" label={terms.asset} />
              <Chip size="small" variant="outlined" label={`pay to ${truncateHash(terms.payTo)}`} />
            </Stack>
          </Stack>
        </Paper>
      ) : null}
      {settlementHash ? (
        <>
          <Alert severity="success">
            Settled:{' '}
            <a href={explorerTxUrl(settlementHash)} target="_blank" rel="noreferrer">
              {settlementHash}
            </a>
          </Alert>
          <TransactionStatus transactionHash={settlementHash} />
        </>
      ) : null}
      {data ? (
        <StructuredDataCard
          title="Unlocked Resource Data"
          subtitle={resource}
          data={data}
        />
      ) : null}
    </Stack>
  );
}
