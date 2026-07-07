'use client'

import { useEffect, useMemo, useState, ReactElement } from 'react'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useAgentTraceStream } from '@lib/hooks/useAgentTraceStream'
import { useAgentRuntime } from '@lib/hooks/useAgentRuntime'
import { useWalletActions } from '@lib/hooks/useWalletActions'
import { updateAgentProfile } from '@lib/agent-profile'
import AgentExecutionConsole from '@/components/AgentExecutionConsole'
import AgentProfilePanel from '@/components/AgentProfilePanel'
import TransactionReviewCard from '@/components/TransactionReviewCard'
import TransactionStatus from '@/components/TransactionStatus'
import PageHeader from '@/components/PageHeader'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

function TraceTimeline({
  traces,
}: {
  traces: Array<{ step_type: string; message: string; created_at: string }>
}) {
  if (!traces.length) {
    return (
      <Typography variant="body2" color="text.secondary">
        Timeline updates live via SSE when the planner runs.
      </Typography>
    )
  }
  return (
    <Stack gap={1} maxHeight={320} sx={{ overflow: 'auto' }}>
      {traces.map((t, i) => (
        <Box key={i} sx={{ py: 0.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="caption" color="primary.main">
            {t.step_type}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t.message}
          </Typography>
        </Box>
      ))}
    </Stack>
  )
}

export default function AgentConsolePage(): ReactElement {
  const searchParams = useSearchParams()
  const wallet = useWalletActions()
  const { traces, connected } = useAgentTraceStream()
  const runtime = useAgentRuntime()
  const [objective, setObjective] = useState('What is the current MRWA yield APY?')

  useEffect(() => {
    const fromQuery = searchParams.get('objective')
    if (fromQuery) setObjective(fromQuery)
  }, [searchParams])

  const sessionTraces = useMemo(
    () =>
      runtime.sessionId
        ? traces.filter((t) => t.session_id === runtime.sessionId)
        : traces.slice(-20),
    [traces, runtime.sessionId],
  )

  const run = async () => {
    const pk = await wallet.getPublicKey()
    if (pk) updateAgentProfile({ walletPublicKey: pk })
    await runtime.execute(objective)
  }

  return (
    <Box>
      <PageHeader
        icon="mdi:robot-outline"
        eyebrow="Agent OS"
        title="Agent Console"
        description="User → Agent → Planner → MCP → Wallet → Casper → Timeline. The dashboard visualizes — this console executes."
      />

      <Stack direction={{ xs: 'column', lg: 'row' }} gap={3} mb={3}>
        <Box flex={2}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" color="common.white" mb={2}>
              Natural Language Mission
            </Typography>
            <TextField
              fullWidth
              multiline
              minRows={2}
              label="What should the agent do?"
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              sx={{ mb: 2 }}
            />
            <Stack direction="row" gap={1} flexWrap="wrap">
              <Button
                variant="contained"
                onClick={() => void run()}
                disabled={runtime.loading || !objective.trim()}
              >
                {runtime.loading ? <CircularProgress size={22} color="inherit" /> : 'Execute'}
              </Button>
              <Button variant="outlined" onClick={runtime.reset} disabled={runtime.loading}>
                Reset
              </Button>
              <Button component={Link} href="/missions" variant="text">
                Mission Library
              </Button>
            </Stack>
          </Paper>

          <AgentExecutionConsole
            phase={runtime.phase}
            reasoning={runtime.reasoning}
            traces={traces}
            sessionId={runtime.sessionId}
            txHash={runtime.txHash}
            error={runtime.error}
            isWriteFlow={Boolean(
              runtime.unsignedTx || runtime.txHash || runtime.steps.some((s) => s.kind === 'write'),
            )}
          />

          {runtime.unsignedTx ? (
            <Box mt={3}>
              <TransactionReviewCard
                transaction={runtime.unsignedTx}
                loading={runtime.loading}
                txHash={runtime.txHash}
                onSignAndSubmit={() => void runtime.signAndContinue()}
              />
            </Box>
          ) : null}

          {runtime.txHash ? (
            <TransactionStatus
              transactionHash={runtime.txHash}
              onFinalized={() => void runtime.onTxFinalized()}
            />
          ) : null}

          {runtime.steps.length > 0 && runtime.phase === 'complete' && !runtime.unsignedTx ? (
            <Paper sx={{ p: 3, mt: 3 }}>
              <Typography variant="subtitle2" color="common.white" mb={1}>
                Read tool results
              </Typography>
              {runtime.steps
                .filter((s) => s.kind === 'read' && s.result)
                .map((s) => (
                  <Box key={s.tool} mb={2}>
                    <Typography variant="caption" color="primary.main">
                      {s.tool}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ whiteSpace: 'pre-wrap' }}
                    >
                      {JSON.stringify(s.result, null, 2).slice(0, 1200)}
                      {JSON.stringify(s.result).length > 1200 ? '…' : ''}
                    </Typography>
                  </Box>
                ))}
            </Paper>
          ) : null}
        </Box>

        <Box flex={1}>
          <AgentProfilePanel />
          <Paper sx={{ p: 3, mt: 3 }}>
            <Stack direction="row" justifyContent="space-between" mb={2}>
              <Typography variant="h6" color="common.white">
                Timeline
              </Typography>
              <Typography variant="caption" color={connected ? 'success.main' : 'warning.main'}>
                {connected ? 'Live SSE' : 'Reconnecting'}
              </Typography>
            </Stack>
            <TraceTimeline traces={sessionTraces} />
          </Paper>
        </Box>
      </Stack>

      {runtime.error ? (
        <Alert severity="error" sx={{ mt: 2 }}>
          {runtime.error}
        </Alert>
      ) : null}
    </Box>
  )
}
