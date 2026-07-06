'use client'

import { useMemo, useState, ReactElement } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useAgentTraceStream } from '@lib/hooks/useAgentTraceStream'
import { useWalletActions } from '@lib/hooks/useWalletActions'
import { meridianApi } from '@lib/api'
import { MCP_TOOLS } from '@lib/mcp-catalog'
import PageHeader from '@/components/PageHeader'
import TransactionReviewCard from '@/components/TransactionReviewCard'
import TransactionStatus from '@/components/TransactionStatus'
import type { UnsignedTransaction } from '@lib/types'
import { parseUnsignedTransaction } from '@lib/transactions'

function TraceList({ traces }: { traces: Array<{ step_type: string; message: string }> }) {
  if (!traces.length) return null
  return (
    <Stack gap={1} mt={2}>
      {traces.map((t, i) => (
        <Box key={i} sx={{ py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Chip size="small" label={t.step_type} sx={{ mr: 1 }} />
          <Typography variant="body2" component="span" color="text.secondary">
            {t.message}
          </Typography>
        </Box>
      ))}
    </Stack>
  )
}

export default function PlaygroundPage(): ReactElement {
  const wallet = useWalletActions()
  const { traces, connected } = useAgentTraceStream()
  const [objective, setObjective] = useState('What is the current MRWA yield APY?')
  const [selectedTool, setSelectedTool] = useState('get_yield_rate')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [plannerResult, setPlannerResult] = useState<unknown>(null)
  const [toolResult, setToolResult] = useState<unknown>(null)
  const [unsignedTx, setUnsignedTx] = useState<UnsignedTransaction | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)

  const toolMeta = useMemo(() => MCP_TOOLS.find((t) => t.name === selectedTool), [selectedTool])

  const runPlanner = async () => {
    setError(null)
    setPlannerResult(null)
    setLoading(true)
    try {
      const publicKey = await wallet.getPublicKey()
      const { data } = await meridianApi.plannerExecute({
        objective,
        callerPublicKey: publicKey ?? undefined,
      })
      setPlannerResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Planner failed')
    } finally {
      setLoading(false)
    }
  }

  const runTool = async () => {
    setError(null)
    setToolResult(null)
    setUnsignedTx(null)
    setLoading(true)
    try {
      const args: Record<string, unknown> = { ...toolMeta?.exampleArgs }
      if (toolMeta?.walletRequired) {
        const pk = await wallet.getPublicKey()
        if (!pk) throw new Error('Connect wallet for write tools')
        args.callerPublicKey = pk
      }
      const { result } = await meridianApi.mcpTool(selectedTool, args)
      if (toolMeta?.kind === 'write') {
        setUnsignedTx(parseUnsignedTransaction(result, 'playground write'))
      } else {
        setToolResult(result)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Tool failed')
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
      setError(err instanceof Error ? err.message : 'Sign failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box>
      <PageHeader
        icon="mdi:flask-outline"
        eyebrow="AI Playground"
        title="Natural Language → Planner → MCP → Wallet → Chain"
        description="Type an objective or invoke a single MCP tool. Reasoning streams to the timeline via SSE."
      />

      <Stack direction={{ xs: 'column', lg: 'row' }} gap={3}>
        <Paper sx={{ p: 3, flex: 1 }}>
          <Typography variant="h6" color="common.white" mb={2}>
            Planner
          </Typography>
          <TextField
            fullWidth
            multiline
            minRows={3}
            label="Natural language objective"
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Button variant="contained" onClick={() => void runPlanner()} disabled={loading}>
            Run Planner
          </Button>
          {plannerResult ? (
            <Box
              component="pre"
              sx={{
                mt: 2,
                p: 2,
                bgcolor: '#0a0a0a',
                borderRadius: 1,
                fontSize: 12,
                overflow: 'auto',
              }}
            >
              {JSON.stringify(plannerResult, null, 2)}
            </Box>
          ) : null}
        </Paper>

        <Paper sx={{ p: 3, flex: 1 }}>
          <Typography variant="h6" color="common.white" mb={2}>
            Direct MCP Tool
          </Typography>
          <TextField
            select
            fullWidth
            label="Tool"
            value={selectedTool}
            onChange={(e) => setSelectedTool(e.target.value)}
            sx={{ mb: 2 }}
          >
            {MCP_TOOLS.map((t) => (
              <MenuItem key={t.name} value={t.name}>
                {t.name} ({t.kind})
              </MenuItem>
            ))}
          </TextField>
          {toolMeta ? (
            <Alert severity={toolMeta.walletRequired ? 'warning' : 'info'} sx={{ mb: 2 }}>
              {toolMeta.description}
              {toolMeta.requiredRole ? ` Role: ${toolMeta.requiredRole}.` : ''}
            </Alert>
          ) : null}
          <Button variant="outlined" onClick={() => void runTool()} disabled={loading}>
            Invoke Tool
          </Button>
          {toolResult ? (
            <Box
              component="pre"
              sx={{
                mt: 2,
                p: 2,
                bgcolor: '#0a0a0a',
                borderRadius: 1,
                fontSize: 12,
                overflow: 'auto',
              }}
            >
              {JSON.stringify(toolResult, null, 2)}
            </Box>
          ) : null}
          {unsignedTx ? (
            <Box mt={2}>
              <TransactionReviewCard
                transaction={unsignedTx}
                loading={loading}
                txHash={txHash}
                onSignAndSubmit={signAndSubmit}
              />
            </Box>
          ) : null}
          {txHash ? <TransactionStatus transactionHash={txHash} /> : null}
        </Paper>
      </Stack>

      <Paper sx={{ p: 3, mt: 3 }}>
        <Stack direction="row" justifyContent="space-between" mb={2}>
          <Typography variant="h6" color="common.white">
            Agent Timeline (SSE)
          </Typography>
          <Chip
            size="small"
            color={connected ? 'success' : 'warning'}
            label={connected ? 'Live' : 'Reconnecting'}
          />
        </Stack>
        <TraceList traces={traces} />
      </Paper>

      {error ? (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      ) : null}
      {loading ? <CircularProgress sx={{ mt: 2 }} size={24} /> : null}
    </Box>
  )
}
