'use client'

import { useEffect, useState, ReactElement } from 'react'
import {
  Paper,
  Stack,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  MenuItem,
} from '@mui/material'
import { useTokenYield, revalidateMeridianData } from '@lib/hooks/useMeridianData'
import { useWalletActions } from '@lib/hooks/useWalletActions'
import { formatApy, formatMotes, MERIDIAN_TOKEN_PACKAGE } from '@lib/contracts'

const MIN_DELEGATION_MOTES = 500_000_000_000n
import { meridianApi } from '@lib/api'
import type { UnsignedTransaction } from '@lib/types'
import { parseUnsignedTransaction } from '@lib/transactions'
import TransactionStatus from '@/components/TransactionStatus'
import TransactionReviewCard from '@/components/TransactionReviewCard'

export default function StakingPanel(): ReactElement {
  const wallet = useWalletActions()
  const { data: yieldInfo, isLoading } = useTokenYield()
  const [validators, setValidators] = useState<Array<{ public_key: string; name?: string }>>([])
  const [toValidator, setToValidator] = useState('')
  const [amount, setAmount] = useState(String(MIN_DELEGATION_MOTES))
  const [unsignedTx, setUnsignedTx] = useState<UnsignedTransaction | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    void (async () => {
      try {
        const { result } = await meridianApi.mcpTool('list_validators', {})
        const list =
          (result as { validators?: Array<{ public_key: string; name?: string }> })?.validators ??
          result
        if (Array.isArray(list) && list.length) {
          setValidators(list as Array<{ public_key: string; name?: string }>)
          setToValidator(list[1]?.public_key ?? list[0]?.public_key ?? '')
        }
      } catch {
        // Validators optional until MCP responds
      }
    })()
  }, [])

  const buildStake = async () => {
    setError(null)
    setTxHash(null)
    const publicKey = await wallet.getPublicKey()
    if (!publicKey) {
      setError('Connect wallet to stake.')
      return
    }
    if (!toValidator) {
      setError('Select a validator.')
      return
    }
    try {
      if (BigInt(amount) < MIN_DELEGATION_MOTES) {
        setError(`Minimum delegation is 500 CSPR (${MIN_DELEGATION_MOTES.toString()} motes).`)
        return
      }
    } catch {
      setError('Enter a valid motes amount.')
      return
    }
    setLoading(true)
    try {
      const { result } = await meridianApi.mcpTool('delegate_stake', {
        callerPublicKey: publicKey,
        validator: toValidator,
        amount,
      })
      setUnsignedTx(parseUnsignedTransaction(result, 'stake delegation response'))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to build stake transaction')
    } finally {
      setLoading(false)
    }
  }

  const signAndSubmit = async () => {
    if (!unsignedTx) return
    setLoading(true)
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
    <Paper sx={{ p: { xs: 4, sm: 6 }, height: 1 }}>
      <Typography variant="h4" color="common.white" mb={3}>
        Staking Vault
      </Typography>
      {isLoading ? (
        <CircularProgress size={24} />
      ) : (
        <Stack gap={1} mb={3}>
          <Typography variant="body2" color="text.secondary">
            Package: {MERIDIAN_TOKEN_PACKAGE.slice(0, 24)}…
          </Typography>
          <Typography variant="body1" color="common.white">
            Total staked: {formatMotes(yieldInfo?.totalStaked ?? '0')} CSPR
          </Typography>
          <Typography variant="body1" color="common.white">
            Estimated APY: {formatApy(yieldInfo?.estimatedApyBps ?? 0)}
          </Typography>
        </Stack>
      )}
      <Stack gap={2}>
        <TextField
          select
          label="Validator"
          value={toValidator}
          onChange={(e) => setToValidator(e.target.value)}
          disabled={!validators.length}
        >
          {validators.map((v) => (
            <MenuItem key={`to-${v.public_key}`} value={v.public_key}>
              {v.name ?? v.public_key.slice(0, 16)}…
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="Amount (motes)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          helperText={`Minimum ${MIN_DELEGATION_MOTES.toString()} motes (500 CSPR) for native delegation`}
        />
        <Alert severity="info">
          Native Casper delegation via <strong>delegate_stake</strong>. MERIDIAN vault deposits use{' '}
          <strong>deposit_to_vault</strong> from MCP.
        </Alert>
        <Stack direction="row" gap={2}>
          <Button variant="contained" onClick={buildStake} disabled={loading}>
            Build stake delegation (MCP)
          </Button>
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
            title="Stake Delegation Transaction"
            description="MCP prepared a native Casper delegation transaction. Confirm the validator, network, and amount before signing."
            loading={loading}
            onSignAndSubmit={signAndSubmit}
          />
        ) : null}
      </Stack>
    </Paper>
  )
}
