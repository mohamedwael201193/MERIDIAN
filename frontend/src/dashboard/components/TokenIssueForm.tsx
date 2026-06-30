'use client'

import { useState, ReactElement } from 'react'
import { Stack, TextField, Button, Alert, CircularProgress } from '@mui/material'
import { meridianApi } from '@lib/api'
import type { UnsignedTransaction } from '@lib/types'
import { useWalletActions } from '@lib/hooks/useWalletActions'
import { parseUnsignedTransaction } from '@lib/transactions'
import TransactionStatus from '@/components/TransactionStatus'
import TransactionReviewCard from '@/components/TransactionReviewCard'
import FlowStepper from '@/components/FlowStepper'
import { revalidateMeridianData } from '@lib/hooks/useMeridianData'

const STEPS = [
  { label: 'Details', icon: 'mdi:form-textbox' },
  { label: 'Build via MCP', icon: 'mdi:wrench-outline' },
  { label: 'Sign & Submit', icon: 'mdi:pen' },
  { label: 'Confirmed', icon: 'mdi:check-decagram' },
]

export default function TokenIssueForm(): ReactElement {
  const wallet = useWalletActions()
  const [symbol, setSymbol] = useState('MRWA')
  const [initialSupply, setInitialSupply] = useState('1000000')
  const [unsignedTx, setUnsignedTx] = useState<UnsignedTransaction | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const activeStep = txHash ? 3 : unsignedTx ? 2 : 0

  const buildTransaction = async () => {
    setError(null)
    setTxHash(null)
    const publicKey = await wallet.getPublicKey()
    if (!publicKey) {
      setError('Connect your wallet before issuing a token.')
      return
    }
    setLoading(true)
    try {
      const { result } = await meridianApi.mcpTool('issue_token', {
        callerPublicKey: publicKey,
        symbol,
        initialSupply,
      })
      setUnsignedTx(parseUnsignedTransaction(result, 'issue_token response'))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to build transaction')
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
      setError(err instanceof Error ? err.message : 'Signing or submission failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Stack gap={3}>
      <FlowStepper steps={STEPS} activeStep={activeStep} />
      <TextField
        label="Symbol"
        value={symbol}
        onChange={(e) => setSymbol(e.target.value)}
        disabled={Boolean(unsignedTx) || Boolean(txHash)}
      />
      <TextField
        label="Initial supply (whole units)"
        value={initialSupply}
        onChange={(e) => setInitialSupply(e.target.value)}
        disabled={Boolean(unsignedTx) || Boolean(txHash)}
      />
      <Stack direction="row" gap={2}>
        <Button
          variant="contained"
          onClick={buildTransaction}
          disabled={loading || Boolean(unsignedTx)}
          startIcon={
            loading && !unsignedTx ? <CircularProgress size={18} color="inherit" /> : undefined
          }
        >
          {loading && !unsignedTx ? 'Building…' : 'Build via MCP'}
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
          title="Issue Token Transaction"
          description="MCP built an unsigned token issuance transaction. Review the summary and sign it with your wallet."
          loading={loading}
          onSignAndSubmit={signAndSubmit}
        />
      ) : null}
    </Stack>
  )
}
