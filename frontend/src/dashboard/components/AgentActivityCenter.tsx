'use client'

import { useMemo, useState, ReactElement } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useAgentTraceStream } from '@lib/hooks/useAgentTraceStream'
import { useDecisions, useEvents } from '@lib/hooks/useMeridianData'
import { useWalletActions } from '@lib/hooks/useWalletActions'
import { meridianApi } from '@lib/api'
import type { AgentTraceRow } from '@lib/types'
import AgentDecisionFeed from '@/dashboard/components/AgentDecisionFeed'
import X402PaymentFlow from '@/dashboard/components/X402PaymentFlow'
import Link from 'next/link'

function formatTime(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(value))
}

function stepColor(step: string): 'default' | 'primary' | 'warning' | 'error' | 'success' {
  if (step === 'error') return 'error'
  if (step === 'wallet_required' || step === 'wallet_signed') return 'warning'
  if (step === 'complete' || step === 'finality') return 'success'
  if (step === 'reasoning' || step === 'tool_selected') return 'primary'
  return 'default'
}

function TraceTimeline({ traces }: { traces: AgentTraceRow[] }): ReactElement {
  if (!traces.length) {
    return (
      <Alert severity="info">
        No agent traces yet. Run the Planner below or connect Claude/Cursor MCP.
      </Alert>
    )
  }

  return (
    <Stack gap={0} divider={<Divider flexItem />}>
      {traces.map((trace) => (
        <Box key={trace.id} sx={{ py: 1.5 }}>
          <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap" mb={0.5}>
            <Chip size="small" label={trace.step_type} color={stepColor(trace.step_type)} />
            <Typography variant="caption" color="text.secondary">
              {formatTime(trace.created_at)}
            </Typography>
            <Chip size="small" variant="outlined" label={trace.agent_name} />
          </Stack>
          <Typography variant="body2" color="common.white">
            {trace.message}
          </Typography>
        </Box>
      ))}
    </Stack>
  )
}

export default function AgentActivityCenter(): ReactElement {
  const wallet = useWalletActions()
  const { traces, connected } = useAgentTraceStream()
  const { data: decisions } = useDecisions(20)
  const { data: events } = useEvents(15)
  const [objective, setObjective] = useState('What is the current MRWA yield APY?')
  const [loading, setLoading] = useState(false)
  const [plannerError, setPlannerError] = useState<string | null>(null)
  const [lastSessionId, setLastSessionId] = useState<string | null>(null)

  const plannerThoughts = useMemo(
    () => traces.filter((t) => t.step_type === 'reasoning' || t.step_type === 'objective_received'),
    [traces],
  )

  const toolCalls = useMemo(
    () =>
      traces.filter((t) =>
        ['tool_discovery', 'tool_selected', 'tool_invoked', 'wallet_required'].includes(
          t.step_type,
        ),
      ),
    [traces],
  )

  const runPlanner = async () => {
    setPlannerError(null)
    setLoading(true)
    try {
      const publicKey = await wallet.getPublicKey()
      const { data } = await meridianApi.plannerExecute({
        objective,
        callerPublicKey: publicKey ?? undefined,
      })
      const sessionId = (data as { sessionId?: string }).sessionId
      if (sessionId) setLastSessionId(sessionId)
    } catch (err) {
      setPlannerError(err instanceof Error ? err.message : 'Planner failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Stack gap={3.5}>
      <Paper sx={{ p: { xs: 3, sm: 4 } }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          gap={2}
          mb={2}
        >
          <Box>
            <Typography variant="h4" color="common.white">
              Agent Timeline
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={0.75}>
              Visualization layer only — traces from Planner, MCP clients, and wallet approvals stream
              here via SSE. Execute missions in the Agent Console.
            </Typography>
          </Box>
          <Chip
            size="small"
            color={connected ? 'success' : 'warning'}
            label={connected ? 'SSE connected' : 'SSE reconnecting'}
          />
        </Stack>

        <Stack direction={{ xs: 'column', md: 'row' }} gap={1.5} mb={2}>
          <TextField
            fullWidth
            label="Planner objective"
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
            placeholder='e.g. "Delegate 500 CSPR to a validator"'
          />
          <Button variant="contained" onClick={() => void runPlanner()} disabled={loading}>
            {loading ? <CircularProgress size={22} color="inherit" /> : 'Run Planner'}
          </Button>
          <Button component={Link} href="/agent" variant="outlined">
            Agent Console
          </Button>
        </Stack>

        {plannerError ? <Alert severity="error">{plannerError}</Alert> : null}
        {lastSessionId ? (
          <Typography variant="caption" color="text.secondary">
            Session: {lastSessionId}
          </Typography>
        ) : null}
      </Paper>

      <Box display="grid" gridTemplateColumns={{ xs: '1fr', lg: '1fr 1fr' }} gap={3}>
        <Paper sx={{ p: 3, minHeight: 280 }}>
          <Typography variant="h6" color="common.white" mb={2}>
            Planner Thoughts
          </Typography>
          <TraceTimeline traces={plannerThoughts} />
        </Paper>

        <Paper sx={{ p: 3, minHeight: 280 }}>
          <Typography variant="h6" color="common.white" mb={2}>
            MCP Tool Transcript
          </Typography>
          <TraceTimeline traces={toolCalls} />
        </Paper>

        <Paper sx={{ p: 3, minHeight: 280 }}>
          <Typography variant="h6" color="common.white" mb={2}>
            Blockchain Events
          </Typography>
          {!events?.length ? (
            <Alert severity="info">No indexed events yet.</Alert>
          ) : (
            <Stack gap={1}>
              {events.slice(0, 8).map((event) => (
                <Box key={event.id}>
                  <Chip size="small" label={event.event_name} sx={{ mr: 1 }} />
                  <Typography variant="caption" color="text.secondary">
                    {event.contract_name} · block {event.block_height}
                  </Typography>
                </Box>
              ))}
            </Stack>
          )}
        </Paper>

        <Paper sx={{ p: 3, minHeight: 280 }}>
          <Typography variant="h6" color="common.white" mb={2}>
            x402 Machine Commerce
          </Typography>
          <X402PaymentFlow />
        </Paper>
      </Box>

      <AgentDecisionFeed />

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" color="common.white" mb={1}>
          Agent Decisions ({decisions?.length ?? 0})
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Yield, Compliance, and Audit agents post structured decisions to the backend. Connect MCP
          clients to drive new activity.
        </Typography>
      </Paper>
    </Stack>
  )
}
