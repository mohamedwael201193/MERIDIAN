'use client';

import { useState, ReactElement } from 'react';
import {
  Paper,
  Stack,
  TextField,
  Typography,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import { validateAccountHash } from '@lib/schemas';
import ComplianceBadge from '@/components/ComplianceBadge';
import { useHolderCompliance } from '@lib/hooks/useMeridianData';
import { explorerAccountUrl, truncateHash } from '@lib/contracts';

export default function ComplianceLookup(): ReactElement {
  const [accountHash, setAccountHash] = useState('');
  const [queryHash, setQueryHash] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const { data, isLoading, error } = useHolderCompliance(queryHash);

  const lookup = () => {
    setValidationError(null);
    try {
      const normalized = validateAccountHash(accountHash.trim());
      setQueryHash(normalized);
    } catch (err) {
      setValidationError(err instanceof Error ? err.message : 'Invalid account hash');
      setQueryHash(null);
    }
  };

  return (
    <Paper sx={{ p: { xs: 4, sm: 6 } }}>
      <Typography variant="h5" color="common.white" mb={2}>
        Holder Compliance Lookup
      </Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} gap={2} mb={3}>
        <TextField
          fullWidth
          label="Account hash"
          placeholder="account-hash-…"
          value={accountHash}
          onChange={e => setAccountHash(e.target.value)}
        />
        <Button variant="contained" onClick={lookup} sx={{ minWidth: 120 }}>
          Lookup
        </Button>
      </Stack>
      {validationError ? <Alert severity="error">{validationError}</Alert> : null}
      {queryHash && isLoading ? <CircularProgress size={24} /> : null}
      {queryHash && error ? (
        <Alert severity="error">Compliance lookup failed for this account.</Alert>
      ) : null}
      {queryHash && data ? (
        <Stack gap={1}>
          <Stack direction="row" gap={1} alignItems="center">
            <Typography variant="body2" color="common.white">
              {truncateHash(data.accountHash, 14, 10)}
            </Typography>
            <ComplianceBadge accountHash={queryHash} />
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Status: {data.status} · Accredited: {data.accredited ? 'Yes' : 'No'}
          </Typography>
          <a href={explorerAccountUrl(data.accountHash)} target="_blank" rel="noreferrer">
            View on testnet explorer
          </a>
        </Stack>
      ) : null}
    </Paper>
  );
}
