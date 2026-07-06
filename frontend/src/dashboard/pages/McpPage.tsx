'use client'

import { useState, ReactElement } from 'react'
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
} from '@mui/material'
import { useWalletActions } from '@lib/hooks/useWalletActions'
import { meridianApi } from '@lib/api'
import type { UnsignedTransaction } from '@lib/types'
import { validatePublicKey } from '@lib/schemas'
import { parseUnsignedTransaction } from '@lib/transactions'
import TransactionStatus from '@/components/TransactionStatus'
import TransactionReviewCard from '@/components/TransactionReviewCard'
import StructuredDataCard from '@/components/StructuredDataCard'
import PageHeader from '@/components/PageHeader'
import IconifyIcon from '@/nickelfox/components/base/IconifyIcon'
import { revalidateMeridianData } from '@lib/hooks/useMeridianData'

interface McpTool {
  id: string
  description: string
  example: string
}

const READ_TOOLS: McpTool[] = [
  {
    id: 'get_token_info',
    description: 'Fetch contract metadata and supply for a token package hash.',
    example: '{"packageHash":"contract-package-..."}',
  },
  {
    id: 'get_yield_rate',
    description: 'Current estimated APY and total staked for a token.',
    example: '{"packageHash":"contract-package-..."}',
  },
  {
    id: 'get_holder_yield',
    description: 'Recent global yield distribution history from the backend.',
    example: '{"limit":20}',
  },
  {
    id: 'get_compliance_status',
    description: 'ComplianceRegistry status for a holder account.',
    example: '{"accountHash":"account-hash-..."}',
  },
  {
    id: 'list_validators',
    description: 'Active Casper validators available for staking.',
    example: '{}',
  },
  {
    id: 'subscribe_audit',
    description: 'Read paid audit events when x402 payment proof is supplied.',
    example: '{"limit":20,"paymentHeader":"..."}',
  },
]

const WRITE_TOOLS: McpTool[] = [
  {
    id: 'issue_token',
    description: 'Disabled: MRWA fixed supply was minted at deployment.',
    example: '{"symbol":"MRWA","initialSupply":"1000000"}',
  },
  {
    id: 'transfer_token',
    description: 'Build a token transfer between two accounts.',
    example: '{"recipientAccountHash":"account-hash-...","amount":"1000"}',
  },
  {
    id: 'register_holder',
    description: 'Register a holder in the ComplianceRegistry.',
    example: '{"holderAccountHash":"account-hash-...","attestationBytes":"00"}',
  },
  {
    id: 'revoke_holder',
    description: "Revoke a holder's compliant status.",
    example: '{"holderAccountHash":"account-hash-...","reason":"manual_review"}',
  },
  {
    id: 'delegate_stake',
    description: 'Build a native Casper delegation transaction for user staking.',
    example: '{"validator":"...","amount":"1000000000"}',
  },
  {
    id: 'restake',
    description: 'Curator-only restake between validators in the StakingVault.',
    example: '{"fromValidator":"...","toValidator":"...","amount":"1000000000"}',
  },
  {
    id: 'distribute_rewards',
    description: 'Trigger StakingVault reward distribution for an era.',
    example: '{"eraId":0}',
  },
]

const ALL_TOOLS = [...READ_TOOLS, ...WRITE_TOOLS]
const WRITE_IDS = new Set(WRITE_TOOLS.map((t) => t.id))

export default function McpPage(): ReactElement {
  const wallet = useWalletActions()
  const [selectedTool, setSelectedTool] = useState<string>('get_token_info')
  const [argsJson, setArgsJson] = useState('{}')
  const [result, setResult] = useState<unknown>(null)
  const [unsignedTx, setUnsignedTx] = useState<UnsignedTransaction | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const activeTool = ALL_TOOLS.find((t) => t.id === selectedTool) ?? ALL_TOOLS[0]
  const isWrite = WRITE_IDS.has(selectedTool)

  const selectTool = (id: string) => {
    setSelectedTool(id)
    const tool = ALL_TOOLS.find((t) => t.id === id)
    setArgsJson(tool?.example ?? '{}')
    setResult(null)
    setUnsignedTx(null)
    setTxHash(null)
    setError(null)
  }

  const invokeTool = async () => {
    setLoading(true)
    setError(null)
    setUnsignedTx(null)
    setTxHash(null)
    try {
      const args = JSON.parse(argsJson) as Record<string, unknown>
      const publicKey = await wallet.getPublicKey()
      if (isWrite) {
        if (!publicKey) throw new Error('Connect wallet for write tools')
        validatePublicKey(publicKey)
        if (!args.callerPublicKey) args.callerPublicKey = publicKey
      }
      const response = await meridianApi.mcpTool(selectedTool, args)
      const payload = response.result
      if (payload && typeof payload === 'object' && 'transaction' in (payload as object)) {
        setUnsignedTx(parseUnsignedTransaction(payload, `${selectedTool} response`))
      }
      setResult(payload)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'MCP call failed')
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
      setResult({ submitted: hash, explorer: `https://testnet.cspr.live/deploy/${hash}` })
      setUnsignedTx(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign/submit failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box display="grid" gridTemplateColumns="repeat(12, 1fr)" gap={3.5}>
      <Box gridColumn={{ xs: 'span 12' }}>
        <PageHeader
          icon="mdi:api"
          eyebrow="Integrations"
          title="MCP Tool Explorer"
          stepLabel="Step 6 of 8"
          description="Invoke MERIDIAN's Model Context Protocol server directly. Read tools return data instantly; write tools return an unsigned transaction for your wallet to sign."
        />
      </Box>
      <Box gridColumn={{ xs: 'span 12', lg: 'span 4' }}>
        <Paper sx={{ p: { xs: 3, sm: 4 }, border: '1px solid', borderColor: 'divider', mb: 3 }}>
          <Stack direction="row" alignItems="center" gap={1} mb={2}>
            <IconifyIcon icon="mdi:book-open-variant" width={18} height={18} color="success.main" />
            <Typography variant="subtitle1" color="common.white">
              Read Tools
            </Typography>
          </Stack>
          <Stack gap={0.5}>
            {READ_TOOLS.map((tool) => (
              <Button
                key={tool.id}
                variant={selectedTool === tool.id ? 'contained' : 'text'}
                color={selectedTool === tool.id ? 'success' : 'inherit'}
                onClick={() => selectTool(tool.id)}
                sx={{ justifyContent: 'flex-start', py: 1, fontFamily: 'monospace', fontSize: 13 }}
              >
                {tool.id}
              </Button>
            ))}
          </Stack>
        </Paper>
        <Paper sx={{ p: { xs: 3, sm: 4 }, border: '1px solid', borderColor: 'divider' }}>
          <Stack direction="row" alignItems="center" gap={1} mb={2}>
            <IconifyIcon icon="mdi:pencil-lock-outline" width={18} height={18} color="error.main" />
            <Typography variant="subtitle1" color="common.white">
              Write Tools
            </Typography>
          </Stack>
          <Stack gap={0.5}>
            {WRITE_TOOLS.map((tool) => (
              <Button
                key={tool.id}
                color="error"
                variant={selectedTool === tool.id ? 'contained' : 'text'}
                onClick={() => selectTool(tool.id)}
                sx={{ justifyContent: 'flex-start', py: 1, fontFamily: 'monospace', fontSize: 13 }}
              >
                {tool.id}
              </Button>
            ))}
          </Stack>
        </Paper>
      </Box>
      <Box gridColumn={{ xs: 'span 12', lg: 'span 8' }}>
        <Paper sx={{ p: { xs: 4, sm: 6 }, border: '1px solid', borderColor: 'divider' }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="flex-start"
            mb={1}
            flexWrap="wrap"
            gap={1}
          >
            <Box>
              <Typography variant="h5" color="common.white" fontFamily="monospace">
                {activeTool.id}
              </Typography>
              <Typography variant="body2" color="text.secondary" mt={0.5}>
                {activeTool.description}
              </Typography>
            </Box>
            <Chip
              label={isWrite ? 'write · requires wallet' : 'read · instant'}
              color={isWrite ? 'error' : 'success'}
            />
          </Stack>
          <TextField
            fullWidth
            multiline
            minRows={4}
            label="Arguments (JSON)"
            value={argsJson}
            onChange={(e) => setArgsJson(e.target.value)}
            sx={{ mb: 2, mt: 3, '& textarea': { fontFamily: 'monospace', fontSize: 13 } }}
          />
          <Stack direction="row" gap={2} mb={2}>
            <Button
              variant="contained"
              onClick={invokeTool}
              disabled={loading}
              startIcon={
                loading ? (
                  <CircularProgress size={18} color="inherit" />
                ) : (
                  <IconifyIcon icon="mdi:play" width={18} height={18} />
                )
              }
            >
              {loading ? 'Invoking…' : 'Invoke'}
            </Button>
          </Stack>
          {error ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          ) : null}
          {txHash ? (
            <TransactionStatus
              transactionHash={txHash}
              onFinalized={() => void revalidateMeridianData()}
            />
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
            <StructuredDataCard title="Tool Result" subtitle={selectedTool} data={result} />
          ) : null}
        </Paper>
      </Box>
    </Box>
  )
}
