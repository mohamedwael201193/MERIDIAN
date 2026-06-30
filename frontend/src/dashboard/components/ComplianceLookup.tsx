'use client'

import { useState, ReactElement } from 'react'
import {
  Paper,
  Stack,
  TextField,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Chip,
  Tooltip,
} from '@mui/material'
import { PublicKey } from 'casper-js-sdk'
import { validateAccountHash } from '@lib/schemas'
import { useHolderCompliance } from '@lib/hooks/useMeridianData'
import { explorerAccountUrl, truncateHash } from '@lib/contracts'
import { useWalletActions } from '@lib/hooks/useWalletActions'

export default function ComplianceLookup(): ReactElement {
  const wallet = useWalletActions()
  const [accountHash, setAccountHash] = useState('')
  const [queryHash, setQueryHash] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const { data, isLoading, error } = useHolderCompliance(queryHash)

  const useConnectedWallet = async () => {
    setValidationError(null)
    const publicKey = await wallet.getPublicKey()
    if (!publicKey) {
      setValidationError('Connect wallet first.')
      return
    }
    try {
      const normalized = PublicKey.fromHex(publicKey).accountHash().toPrefixedString()
      setAccountHash(normalized)
      setQueryHash(normalized)
    } catch {
      setValidationError('Connected wallet public key is invalid.')
    }
  }

  const lookup = () => {
    setValidationError(null)
    try {
      const normalized = validateAccountHash(accountHash.trim())
      setQueryHash(normalized)
    } catch (err) {
      setValidationError(err instanceof Error ? err.message : 'Invalid account hash')
      setQueryHash(null)
    }
  }

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
          onChange={(e) => setAccountHash(e.target.value)}
        />
        <Button variant="contained" onClick={lookup} sx={{ minWidth: 120 }}>
          Lookup
        </Button>
        <Button variant="outlined" onClick={() => void useConnectedWallet()} sx={{ minWidth: 180 }}>
          Use connected wallet
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
            <Tooltip
              title={
                data.revokeReason
                  ? `Revoked: ${data.revokeReason}`
                  : data.registeredAt
                    ? `Registered ${new Date(data.registeredAt).toLocaleString()}`
                    : data.status
              }
            >
              <Chip
                size="small"
                label={data.compliant ? 'Compliant' : data.status}
                color={data.compliant ? 'success' : data.status === 'revoked' ? 'error' : 'warning'}
              />
            </Tooltip>
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
  )
}
