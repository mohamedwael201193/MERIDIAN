'use client';

import { useState, ReactElement } from 'react';
import {
  Box,
  Paper,
  Stack,
  Typography,
  Button,
  Chip,
  Alert,
  CircularProgress,
  TextField,
} from '@mui/material';
import { useWalletActions } from '@lib/hooks/useWalletActions';
import { meridianApi } from '@lib/api';
import type { UnsignedTransaction } from '@lib/types';
import { validatePublicKey } from '@lib/schemas';
import TransactionStatus from '@/components/TransactionStatus';
import TransactionReviewCard from '@/components/TransactionReviewCard';
import StructuredDataCard from '@/components/StructuredDataCard';
import { revalidateMeridianData } from '@lib/hooks/useMeridianData';

const READ_TOOLS = [
  'get_token_info',
  'get_yield_rate',
  'get_holder_yield',
  'get_compliance_status',
  'list_validators',
  'subscribe_audit',
] as const;

const WRITE_TOOLS = [
  'issue_token',
  'transfer_token',
  'register_holder',
  'revoke_holder',
  'restake',
  'distribute_rewards',
] as const;

export default function McpPage(): ReactElement {
  const wallet = useWalletActions();
  const [selectedTool, setSelectedTool] = useState<string>('get_token_info');
  const [argsJson, setArgsJson] = useState('{}');
  const [result, setResult] = useState<unknown>(null);
  const [unsignedTx, setUnsignedTx] = useState<UnsignedTransaction | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const invokeTool = async () => {
    setLoading(true);
    setError(null);
    setUnsignedTx(null);
    setTxHash(null);
    try {
      const args = JSON.parse(argsJson) as Record<string, unknown>;
      const publicKey = await wallet.getPublicKey();
      if (WRITE_TOOLS.includes(selectedTool as (typeof WRITE_TOOLS)[number])) {
        if (!publicKey) throw new Error('Connect wallet for write tools');
        validatePublicKey(publicKey);
        if (!args.callerPublicKey) args.callerPublicKey = publicKey;
      }
      const response = await meridianApi.mcpTool(selectedTool, args);
      const payload = response.result;
      if (payload && typeof payload === 'object' && 'transaction' in (payload as object)) {
        setUnsignedTx(payload as UnsignedTransaction);
      }
      setResult(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'MCP call failed');
    } finally {
      setLoading(false);
    }
  };

  const signAndSubmit = async () => {
    if (!unsignedTx) return;
    setLoading(true);
    try {
      const hash = await wallet.signAndSubmit(unsignedTx);
      setTxHash(hash);
      setResult({ submitted: hash, explorer: `https://testnet.cspr.live/deploy/${hash}` });
      setUnsignedTx(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign/submit failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box display="grid" gridTemplateColumns="repeat(12, 1fr)" gap={3.5}>
      <Box gridColumn={{ xs: 'span 12', lg: 'span 5' }}>
        <Paper sx={{ p: { xs: 4, sm: 6 }, border: '1px solid', borderColor: 'divider', mb: 3 }}>
          <Typography variant="h5" color="common.white" mb={2}>
            Read Tools
          </Typography>
          <Stack gap={1}>
            {READ_TOOLS.map(tool => (
              <Button
                key={tool}
                variant={selectedTool === tool ? 'contained' : 'text'}
                onClick={() => setSelectedTool(tool)}
                sx={{ justifyContent: 'flex-start' }}
              >
                {tool}
              </Button>
            ))}
          </Stack>
        </Paper>
        <Paper sx={{ p: { xs: 4, sm: 6 }, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h5" color="common.white" mb={2}>
            Write Tools
          </Typography>
          <Stack gap={1}>
            {WRITE_TOOLS.map(tool => (
              <Button
                key={tool}
                color="error"
                variant={selectedTool === tool ? 'contained' : 'text'}
                onClick={() => setSelectedTool(tool)}
                sx={{ justifyContent: 'flex-start' }}
              >
                {tool}
              </Button>
            ))}
          </Stack>
        </Paper>
      </Box>
      <Box gridColumn={{ xs: 'span 12', lg: 'span 7' }}>
        <Paper sx={{ p: { xs: 4, sm: 8 }, border: '1px solid', borderColor: 'divider' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h4" color="common.white">
              MCP Tool Explorer
            </Typography>
            <Chip
              label={WRITE_TOOLS.includes(selectedTool as (typeof WRITE_TOOLS)[number]) ? 'write' : 'read'}
              color={WRITE_TOOLS.includes(selectedTool as (typeof WRITE_TOOLS)[number]) ? 'error' : 'success'}
            />
          </Stack>
          <TextField
            fullWidth
            multiline
            minRows={4}
            label="Arguments (JSON)"
            value={argsJson}
            onChange={e => setArgsJson(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Stack direction="row" gap={2} mb={2}>
            <Button variant="contained" onClick={invokeTool} disabled={loading}>
              {loading ? <CircularProgress size={20} /> : 'Invoke'}
            </Button>
          </Stack>
          {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}
          {txHash ? (
            <TransactionStatus transactionHash={txHash} onFinalized={() => void revalidateMeridianData()} />
          ) : null}
          {unsignedTx ? (
            <TransactionReviewCard
              transaction={unsignedTx}
              title={`${selectedTool} Transaction`}
              description="MCP returned an unsigned TransactionV1. Sign it with your wallet to submit it to Casper testnet."
              loading={loading}
              onSignAndSubmit={signAndSubmit}
            />
          ) : null}
          {result && !unsignedTx ? (
            <StructuredDataCard
              title="Tool Result"
              subtitle={selectedTool}
              data={result}
            />
          ) : null}
        </Paper>
      </Box>
    </Box>
  );
}
