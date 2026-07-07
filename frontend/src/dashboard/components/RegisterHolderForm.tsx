'use client'

import { ReactElement, useState } from 'react'
import { Alert, Button, CircularProgress, Paper, Stack, TextField, Typography } from '@mui/material'
import { PublicKey } from 'casper-js-sdk'
import { meridianApi } from '@lib/api'
import { explorerTxUrl, truncateHash } from '@lib/contracts'
import { revalidateMeridianData } from '@lib/hooks/useMeridianData'
import { useWalletActions } from '@lib/hooks/useWalletActions'
import { validateAccountHash } from '@lib/schemas'
import { parseUnsignedTransaction } from '@lib/transactions'
import type { UnsignedTransaction } from '@lib/types'
import TransactionReviewCard from '@/components/TransactionReviewCard'
import TransactionStatus from '@/components/TransactionStatus'

function isHex(value: string): boolean {
  return /^[0-9a-f]+$/i.test(value) && value.length % 2 === 0
}

export default function RegisterHolderForm(): ReactElement {
  const wallet = useWalletActions()
  const [holderAccountHash, setHolderAccountHash] = useState('')
  const [attestationBytes, setAttestationBytes] = useState('default')
  const [unsignedTx, setUnsignedTx] = useState<UnsignedTransaction | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const useConnectedHolder = async () => {
    setError(null)
    const publicKey = await wallet.getPublicKey()
    if (!publicKey) {
      setError('Connect wallet first.')
      return
    }
    try {
      setHolderAccountHash(PublicKey.fromHex(publicKey).accountHash().toPrefixedString())
    } catch {
      setError('Connected wallet public key is invalid.')
    }
  }

  const buildRegisterHolder = async () => {
    setError(null)
    setTxHash(null)
    setUnsignedTx(null)

    const publicKey = await wallet.getPublicKey()
    if (!publicKey) {
      setError('Connect wallet to register a holder.')
      return
    }

    let normalizedHolder: string
    try {
      normalizedHolder = validateAccountHash(holderAccountHash.trim())
    } catch {
      setError('Enter a valid account hash for the holder.')
      return
    }

    const normalizedAttestation = attestationBytes.trim().replace(/^0x/, '') || 'default'
    if (normalizedAttestation !== 'default' && !isHex(normalizedAttestation)) {
      setError('Attestation must be "default" or an even-length hex bytesrepr payload.')
      return
    }

    setLoading(true)
    try {
      const { result } = await meridianApi.mcpTool('register_holder', {
        callerPublicKey: publicKey,
        holderAccountHash: normalizedHolder,
        attestationBytes: normalizedAttestation,
      })
      setUnsignedTx(parseUnsignedTransaction(result, 'register_holder response'))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to build register holder transaction')
    } finally {
      setLoading(false)
    }
  }

  const signAndSubmit = async () => {
    if (!unsignedTx) return
    setLoading(true)
    setError(null)
    try {
      const hash = await wallet.signAndSubmit(unsignedTx)
      setTxHash(hash)
      setUnsignedTx(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign/submit failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Paper sx={{ p: { xs: 4, sm: 6 } }}>
      <Stack gap={2.5}>
        <Stack gap={0.5}>
          <Typography variant="h5" color="common.white">
            Register holder
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Build a real ComplianceRegistry register_holder transaction through MCP, then sign it
            with the connected CSPR.click wallet.
          </Typography>
        </Stack>

        <Stack direction={{ xs: 'column', sm: 'row' }} gap={2}>
          <TextField
            fullWidth
            label="Holder account hash"
            placeholder="account-hash-..."
            value={holderAccountHash}
            onChange={(e) => setHolderAccountHash(e.target.value)}
            disabled={Boolean(unsignedTx)}
          />
          <Button
            variant="outlined"
            onClick={() => void useConnectedHolder()}
            disabled={Boolean(unsignedTx)}
          >
            Use connected wallet
          </Button>
        </Stack>

        <TextField
          label="Attestation"
          helperText='Use "default" for permissive testnet attestation, or paste Odra bytesrepr hex.'
          value={attestationBytes}
          onChange={(e) => setAttestationBytes(e.target.value)}
          disabled={Boolean(unsignedTx)}
        />

        <Stack direction="row" gap={2} alignItems="center" flexWrap="wrap">
          <Button
            variant="contained"
            onClick={buildRegisterHolder}
            disabled={loading || Boolean(unsignedTx)}
            startIcon={
              loading && !unsignedTx ? <CircularProgress size={18} color="inherit" /> : undefined
            }
          >
            {loading && !unsignedTx ? 'Building...' : 'Build register holder (MCP)'}
          </Button>
          {txHash ? (
            <Typography
              component="a"
              href={explorerTxUrl(txHash)}
              target="_blank"
              rel="noreferrer"
              variant="body2"
              color="primary.main"
            >
              Explorer: {truncateHash(txHash)}
            </Typography>
          ) : null}
        </Stack>

        {error ? <Alert severity="error">{error}</Alert> : null}
        {txHash ? (
          <TransactionStatus
            transactionHash={txHash}
            onFinalized={() => void revalidateMeridianData()}
          />
        ) : null}
        {unsignedTx ? (
          <TransactionReviewCard
            transaction={unsignedTx}
            title="Register Holder Transaction"
            description="MCP built an unsigned ComplianceRegistry transaction. Review the contract call and sign it with the compliance wallet."
            loading={loading}
            onSignAndSubmit={signAndSubmit}
          />
        ) : null}
      </Stack>
    </Paper>
  )
}
