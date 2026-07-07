'use client'

import { useMemo, useState, ReactElement } from 'react'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  LinearProgress,
  Link,
  Stack,
  Typography,
} from '@mui/material'
import { motion, AnimatePresence } from 'motion/react'
import IconifyIcon from '@/nickelfox/components/base/IconifyIcon'
import GlassCard from '@/design/components/GlassCard'
import type { AgentTraceRow } from '@lib/types'
import type { RuntimePhase } from '@lib/hooks/useAgentRuntime'
import type { UnsignedTransaction } from '@lib/types'
import { PIPELINE_STAGES, meridianTokens, type PipelineStageDef } from '@/design/tokens'
import { explorerTxUrl } from '@lib/contracts'

type StageStatus = 'pending' | 'active' | 'done' | 'error' | 'skipped'

const TRANSACTION_ONLY_STAGES = new Set([
  'wallet',
  'building',
  'simulation',
  'approval',
  'broadcast',
  'explorer',
  'confirmed',
])

function stageIsRelevant(
  stageId: string,
  isWriteFlow: boolean,
  steps: Array<{ tool: string; kind: string }>,
): boolean {
  if (isWriteFlow) return true
  if (TRANSACTION_ONLY_STAGES.has(stageId)) return false
  if (stageId === 'compliance') return steps.some((step) => step.tool.includes('compliance'))
  if (stageId === 'validators') return steps.some((step) => step.tool === 'list_validators')
  return stageId === 'planning' || stageId === 'contracts'
}

function hasTrace(traces: AgentTraceRow[], types: string[]): boolean {
  return types.some((t) => traces.some((tr) => tr.step_type === t))
}

function resolveStageStatus(
  stageId: string,
  phase: RuntimePhase,
  traces: AgentTraceRow[],
  txHash: string | null,
  hasUnsignedTx: boolean,
  isWriteFlow: boolean,
  steps: Array<{ tool: string; kind: string }>,
): StageStatus {
  if (!stageIsRelevant(stageId, isWriteFlow, steps)) {
    return 'skipped'
  }

  if (phase === 'error') {
    if (hasTrace(traces, ['error']) && ['building', 'approval', 'broadcast'].includes(stageId)) {
      return 'error'
    }
    return 'pending'
  }

  switch (stageId) {
    case 'planning':
      if (hasTrace(traces, ['objective_received', 'reasoning'])) return 'done'
      if (phase === 'thinking') return 'active'
      if (phase !== 'idle') return 'done'
      return 'pending'

    case 'contracts':
      if (steps.some((s) => s.kind === 'read') && phase !== 'thinking' && phase !== 'idle')
        return 'done'
      if (hasTrace(traces, ['tool_selected', 'tool_invoked'])) return 'done'
      return phase === 'selecting' || phase === 'calling' ? 'active' : 'pending'

    case 'compliance':
      if (steps.some((s) => s.tool.includes('compliance'))) return 'done'
      if (
        hasTrace(traces, ['tool_invoked']) &&
        traces.some((t) => t.message?.toLowerCase().includes('compliance'))
      ) {
        return 'done'
      }
      return 'pending'

    case 'wallet':
      if (!isWriteFlow) return 'skipped'
      if (hasUnsignedTx || hasTrace(traces, ['wallet_required'])) return 'done'
      return phase === 'wallet' ? 'active' : 'pending'

    case 'validators':
      if (steps.some((s) => s.tool === 'list_validators')) return 'done'
      return 'pending'

    case 'building':
      if (hasUnsignedTx || steps.some((s) => s.kind === 'write')) return 'done'
      if (phase === 'complete' || phase === 'read_result') return isWriteFlow ? 'pending' : 'done'
      return phase === 'analyzing' ? 'active' : 'pending'

    case 'simulation':
      if (!isWriteFlow) return 'skipped'
      if (hasUnsignedTx) return 'done'
      return 'pending'

    case 'approval':
      if (!isWriteFlow) return 'skipped'
      if (hasTrace(traces, ['wallet_signed'])) return 'done'
      if (hasUnsignedTx && (phase === 'wallet' || phase === 'waiting')) return 'active'
      if (txHash) return 'done'
      return 'pending'

    case 'broadcast':
      if (!isWriteFlow) return 'skipped'
      if (!txHash) return phase === 'broadcast' ? 'active' : 'pending'
      if (hasTrace(traces, ['deploy_broadcast']) || txHash) return 'done'
      return 'pending'

    case 'explorer':
      if (!isWriteFlow) return 'skipped'
      if (!txHash) return 'pending'
      return 'done'

    case 'confirmed':
      if (!isWriteFlow) return 'skipped'
      if (!txHash) return 'pending'
      if (
        hasTrace(traces, ['finality', 'complete']) ||
        phase === 'complete' ||
        phase === 'finalized'
      ) {
        return 'done'
      }
      if (phase === 'broadcast') return 'active'
      return 'pending'

    default:
      return 'pending'
  }
}

function StatusIcon({ status, index }: { status: StageStatus; index: number }) {
  const colors: Record<StageStatus, string> = {
    pending: meridianTokens.color.textMuted,
    active: meridianTokens.color.accent,
    done: meridianTokens.color.success,
    error: meridianTokens.color.error,
    skipped: meridianTokens.color.textMuted,
  }

  return (
    <motion.div
      animate={status === 'active' ? { scale: [1, 1.08, 1] } : {}}
      transition={{ repeat: status === 'active' ? Infinity : 0, duration: 1.2 }}
    >
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          bgcolor:
            status === 'pending' || status === 'skipped'
              ? 'rgba(255,255,255,0.05)'
              : `${colors[status]}22`,
          border: '2px solid',
          borderColor: colors[status],
          color: colors[status],
          fontSize: 13,
          fontWeight: 700,
          zIndex: 1,
          opacity: status === 'skipped' ? 0.35 : 1,
        }}
      >
        {status === 'done' ? (
          <IconifyIcon icon="mdi:check" width={16} />
        ) : status === 'error' ? (
          <IconifyIcon icon="mdi:alert" width={16} />
        ) : status === 'skipped' ? (
          <IconifyIcon icon="mdi:minus" width={16} />
        ) : status === 'active' ? (
          <Box
            component={motion.div}
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
          >
            <IconifyIcon icon="mdi:loading" width={16} />
          </Box>
        ) : (
          index + 1
        )}
      </Box>
    </motion.div>
  )
}

interface AgentPipelineProps {
  phase: RuntimePhase
  reasoning: string | null
  traces: AgentTraceRow[]
  sessionId: string | null
  txHash: string | null
  error: string | null
  unsignedTx: UnsignedTransaction | null
  steps?: Array<{ tool: string; kind: string; rationale: string }>
}

export default function AgentPipeline({
  phase,
  reasoning,
  traces,
  sessionId,
  txHash,
  error,
  unsignedTx,
  steps = [],
}: AgentPipelineProps): ReactElement {
  const [expanded, setExpanded] = useState<string | false>('planning')

  const sessionTraces = useMemo(
    () => (sessionId ? traces.filter((t) => t.session_id === sessionId) : traces.slice(-40)),
    [traces, sessionId],
  )

  const isWriteFlow = useMemo(
    () => Boolean(unsignedTx) || Boolean(txHash) || steps.some((s) => s.kind === 'write'),
    [unsignedTx, txHash, steps],
  )

  const visibleStages = useMemo(() => {
    return PIPELINE_STAGES.filter((stage) => stageIsRelevant(stage.id, isWriteFlow, steps))
  }, [isWriteFlow, steps])

  const progress = useMemo(() => {
    if (phase === 'idle') return 0
    const applicable = visibleStages.filter(
      (s) =>
        resolveStageStatus(
          s.id,
          phase,
          sessionTraces,
          txHash,
          Boolean(unsignedTx),
          isWriteFlow,
          steps,
        ) !== 'skipped',
    )
    if (applicable.length === 0) return 0
    const done = applicable.filter(
      (s) =>
        resolveStageStatus(
          s.id,
          phase,
          sessionTraces,
          txHash,
          Boolean(unsignedTx),
          isWriteFlow,
          steps,
        ) === 'done',
    ).length
    if (phase === 'complete' || phase === 'read_result') return 100
    return Math.min(95, Math.round((done / applicable.length) * 100))
  }, [phase, sessionTraces, txHash, unsignedTx, isWriteFlow, steps, visibleStages])

  if (phase === 'idle') return <></>

  return (
    <GlassCard
      padding={3}
      sx={{
        mb: 3,
        position: { lg: 'sticky' },
        top: { lg: 88 },
        maxHeight: { lg: 'calc(100vh - 140px)' },
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2.5}>
        <Box>
          <Typography sx={{ ...meridianTokens.typography.label, color: 'primary.main', mb: 0.5 }}>
            Live execution
          </Typography>
          <Typography sx={{ ...meridianTokens.typography.title, color: 'common.white' }}>
            {isWriteFlow ? 'On-chain execution' : 'Live read execution'}
          </Typography>
        </Box>
        {sessionId ? (
          <Box
            sx={{
              px: 1.5,
              py: 0.75,
              borderRadius: 2,
              bgcolor: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <Typography
              variant="caption"
              color="text.disabled"
              sx={{ fontFamily: meridianTokens.typography.fontFamilyMono }}
            >
              {sessionId.slice(0, 8)}
            </Typography>
          </Box>
        ) : null}
      </Stack>

      {!isWriteFlow && phase === 'read_result' ? (
        <Typography variant="body2" color="text.secondary" mb={2}>
          Live data returned from read tools and indexed Casper state. No transaction was requested.
        </Typography>
      ) : null}

      {isWriteFlow && !txHash && phase === 'wallet' && unsignedTx ? (
        <Typography variant="body2" color="warning.light" mb={2}>
          Wallet approval required to broadcast on Casper testnet.
        </Typography>
      ) : null}

      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{
          mb: 2.5,
          height: 4,
          borderRadius: 2,
          bgcolor: 'rgba(255,255,255,0.06)',
          '& .MuiLinearProgress-bar': { borderRadius: 2, bgcolor: meridianTokens.color.accent },
        }}
      />

      <Stack gap={0}>
        <AnimatePresence>
          {visibleStages.map((stage: PipelineStageDef, index: number) => {
            const status = resolveStageStatus(
              stage.id,
              phase,
              sessionTraces,
              txHash,
              Boolean(unsignedTx),
              isWriteFlow,
              steps,
            )
            if (status === 'skipped') return null

            const stageTraces = sessionTraces.filter((t) => stage.traceTypes.includes(t.step_type))
            const isExpanded = expanded === stage.id

            return (
              <motion.div
                key={stage.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.04, ...meridianTokens.motion.spring }}
              >
                <Accordion
                  expanded={isExpanded}
                  onChange={() => setExpanded(isExpanded ? false : stage.id)}
                  disableGutters
                  elevation={0}
                  sx={{
                    bgcolor: 'transparent',
                    '&:before': { display: 'none' },
                    borderLeft:
                      status === 'active'
                        ? `2px solid ${meridianTokens.color.accent}`
                        : '2px solid transparent',
                    pl: 1,
                  }}
                >
                  <AccordionSummary
                    expandIcon={<IconifyIcon icon="mdi:chevron-down" width={18} />}
                    sx={{ minHeight: 48, '& .MuiAccordionSummary-content': { my: 0.5 } }}
                  >
                    <Stack direction="row" gap={1.5} alignItems="center" width="100%">
                      <StatusIcon status={status} index={index} />
                      <Box flex={1}>
                        <Typography
                          variant="subtitle2"
                          color={
                            status === 'active'
                              ? 'primary.main'
                              : status === 'done'
                                ? 'success.main'
                                : status === 'error'
                                  ? 'error.main'
                                  : 'text.secondary'
                          }
                        >
                          {status === 'error' ? `Failed: ${stage.label}` : stage.label}
                        </Typography>
                        <Typography variant="caption" color="text.disabled" display="block">
                          {stage.human}
                        </Typography>
                      </Box>
                    </Stack>
                  </AccordionSummary>
                  <AccordionDetails sx={{ pt: 0, pl: 6 }}>
                    {stage.id === 'planning' && reasoning ? (
                      <Typography variant="body2" color="text.secondary" mb={1}>
                        {reasoning}
                      </Typography>
                    ) : null}
                    {stage.id === 'simulation' && unsignedTx ? (
                      <Typography variant="body2" color="text.secondary" mb={1}>
                        {unsignedTx.note ?? 'Unsigned transaction ready'}
                      </Typography>
                    ) : null}
                    {stageTraces.map((t) => (
                      <Typography key={t.id} variant="body2" color="text.disabled" fontSize={12}>
                        {t.message}
                      </Typography>
                    ))}
                    {stage.id === 'explorer' && txHash ? (
                      <Link href={explorerTxUrl(txHash)} target="_blank" variant="body2">
                        {explorerTxUrl(txHash)}
                      </Link>
                    ) : null}
                    {stage.id === 'explorer' && !txHash ? (
                      <Typography variant="caption" color="text.disabled">
                        Explorer link appears after broadcast.
                      </Typography>
                    ) : null}
                    {steps.length > 0 && ['contracts', 'building'].includes(stage.id) ? (
                      <Typography
                        variant="caption"
                        color="text.disabled"
                        component="pre"
                        sx={{ mt: 1, fontFamily: 'var(--font-geist-mono, monospace)' }}
                      >
                        {steps.map((s) => `${s.kind}: ${s.tool}`).join('\n')}
                      </Typography>
                    ) : null}
                  </AccordionDetails>
                </Accordion>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </Stack>

      {error ? (
        <Stack mt={2} gap={0.5}>
          <Typography variant="subtitle2" color="error.light">
            Execution failed
          </Typography>
          <Typography variant="body2" color="error.light">
            {error}
          </Typography>
        </Stack>
      ) : null}
    </GlassCard>
  )
}
