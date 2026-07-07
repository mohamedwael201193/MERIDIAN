'use client'

import { useMemo, ReactElement } from 'react'
import {
  Alert,
  Box,
  Chip,
  LinearProgress,
  Link,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import type { AgentTraceRow } from '@lib/types'
import type { RuntimePhase } from '@lib/hooks/useAgentRuntime'
import { explorerTxUrl } from '@lib/contracts'

interface ConsoleStage {
  id: string
  label: string
  traceTypes: string[]
}

const CONSOLE_STAGES: ConsoleStage[] = [
  { id: 'thinking', label: 'Thinking…', traceTypes: ['objective_received', 'reasoning'] },
  { id: 'selecting', label: 'Selecting tool…', traceTypes: ['tool_discovery', 'tool_selected'] },
  { id: 'calling', label: 'Calling MCP…', traceTypes: ['tool_invoked'] },
  { id: 'analyzing', label: 'Received result…', traceTypes: [] },
  { id: 'wallet', label: 'Need wallet?', traceTypes: ['wallet_required'] },
  { id: 'waiting', label: 'Waiting for approval…', traceTypes: ['wallet_signed'] },
  { id: 'broadcast', label: 'Broadcast…', traceTypes: ['deploy_broadcast'] },
  { id: 'finalized', label: 'Finalized…', traceTypes: ['finality', 'indexer_updated'] },
  { id: 'explorer', label: 'Explorer', traceTypes: [] },
  { id: 'complete', label: 'Mission Complete', traceTypes: ['complete'] },
]

const PHASE_ORDER: RuntimePhase[] = [
  'thinking',
  'selecting',
  'calling',
  'analyzing',
  'wallet',
  'waiting',
  'broadcast',
  'finalized',
  'complete',
]

function stageStatus(
  stageId: string,
  phase: RuntimePhase,
  traces: AgentTraceRow[],
  txHash: string | null,
): 'pending' | 'active' | 'done' | 'error' {
  if (phase === 'error') {
    const hasError = traces.some((t) => t.step_type === 'error')
    if (hasError && stageId === 'calling') return 'error'
    return 'pending'
  }

  const stage = CONSOLE_STAGES.find((s) => s.id === stageId)
  if (!stage) return 'pending'

  const phaseIdx = PHASE_ORDER.indexOf(phase)
  const stageIdx = CONSOLE_STAGES.findIndex((s) => s.id === stageId)

  if (stage.traceTypes.some((t) => traces.some((tr) => tr.step_type === t))) return 'done'
  if (stageId === 'explorer' && txHash) return 'done'
  if (stageId === 'analyzing' && traces.some((t) => t.step_type === 'tool_invoked')) return 'done'
  if (phaseIdx >= 0 && stageIdx === phaseIdx) return 'active'
  if (phaseIdx > stageIdx) return 'done'

  return 'pending'
}

interface AgentExecutionConsoleProps {
  phase: RuntimePhase
  reasoning: string | null
  traces: AgentTraceRow[]
  sessionId: string | null
  txHash: string | null
  error: string | null
}

export default function AgentExecutionConsole({
  phase,
  reasoning,
  traces,
  sessionId,
  txHash,
  error,
}: AgentExecutionConsoleProps): ReactElement {
  const sessionTraces = useMemo(
    () =>
      sessionId ? traces.filter((t) => t.session_id === sessionId) : traces.slice(-30),
    [traces, sessionId],
  )

  const activeProgress = useMemo(() => {
    if (phase === 'idle') return 0
    if (phase === 'complete') return 100
    const idx = PHASE_ORDER.indexOf(phase)
    return idx >= 0 ? Math.round(((idx + 1) / PHASE_ORDER.length) * 100) : 10
  }, [phase])

  if (phase === 'idle') {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" color="common.white" mb={1}>
          Agent Console
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Ask in natural language or run a mission. Every stage appears here — no raw JSON.
        </Typography>
      </Paper>
    )
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" color="common.white">
          Agent Console
        </Typography>
        {sessionId ? (
          <Chip size="small" variant="outlined" label={`Session ${sessionId.slice(0, 8)}…`} />
        ) : null}
      </Stack>

      <LinearProgress variant="determinate" value={activeProgress} sx={{ mb: 3, height: 6 }} />

      <Stack gap={0}>
        {CONSOLE_STAGES.map((stage, index) => {
          const status = stageStatus(stage.id, phase, sessionTraces, txHash)
          const isLast = index === CONSOLE_STAGES.length - 1

          return (
            <Box key={stage.id}>
              <Stack direction="row" gap={2} alignItems="flex-start" py={1.5}>
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 14,
                    flexShrink: 0,
                    bgcolor:
                      status === 'done'
                        ? 'success.dark'
                        : status === 'active'
                          ? 'primary.main'
                          : status === 'error'
                            ? 'error.dark'
                            : 'action.disabledBackground',
                    color: status === 'pending' ? 'text.disabled' : 'common.white',
                  }}
                >
                  {status === 'done' ? '✓' : status === 'error' ? '!' : index + 1}
                </Box>
                <Box flex={1}>
                  <Typography
                    variant="subtitle2"
                    color={
                      status === 'active'
                        ? 'primary.main'
                        : status === 'done'
                          ? 'success.main'
                          : 'text.secondary'
                    }
                  >
                    {stage.label}
                  </Typography>
                  {stage.id === 'thinking' && reasoning ? (
                    <Typography variant="body2" color="text.secondary" mt={0.5}>
                      {reasoning}
                    </Typography>
                  ) : null}
                  {stage.traceTypes.length > 0
                    ? sessionTraces
                        .filter((t) => stage.traceTypes.includes(t.step_type))
                        .map((t) => (
                          <Typography key={t.id} variant="body2" color="text.secondary" mt={0.5}>
                            {t.message}
                          </Typography>
                        ))
                    : null}
                  {stage.id === 'explorer' && txHash ? (
                    <Link href={explorerTxUrl(txHash)} target="_blank" variant="body2" mt={0.5}>
                      View on testnet.cspr.live →
                    </Link>
                  ) : null}
                </Box>
              </Stack>
              {!isLast ? (
                <Box sx={{ ml: 1.75, borderLeft: '2px dashed', borderColor: 'divider', height: 8 }} />
              ) : null}
            </Box>
          )
        })}
      </Stack>

      {error ? (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      ) : null}

      {phase === 'complete' ? (
        <Alert severity="success" sx={{ mt: 2 }}>
          Mission complete. Check the timeline below for full trace history.
        </Alert>
      ) : null}
    </Paper>
  )
}
