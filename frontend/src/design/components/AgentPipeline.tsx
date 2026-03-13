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
import { PIPELINE_STAGES, meridianTokens } from '@/design/tokens'
import { panelSurfaceSx } from '@/design/surface'
import { explorerTxUrl } from '@lib/contracts'

type StageStatus = 'pending' | 'active' | 'done' | 'error'

function resolveStageStatus(
  stageId: string,
  phase: RuntimePhase,
  traces: AgentTraceRow[],
  txHash: string | null,
  hasUnsignedTx: boolean,
): StageStatus {
  if (phase === 'error') {
    const errTrace = traces.some((t) => t.step_type === 'error')
    if (errTrace && ['building', 'approval', 'broadcast'].includes(stageId)) return 'error'
  }

  const stage = PIPELINE_STAGES.find((s) => s.id === stageId)
  if (!stage) return 'pending'

  const stageIndex = PIPELINE_STAGES.findIndex((s) => s.id === stageId)

  if (stage.traceTypes.some((t) => traces.some((tr) => tr.step_type === t))) return 'done'
  if (stageId === 'explorer' && txHash) return 'done'
  if (stageId === 'confirmed' && traces.some((t) => t.step_type === 'complete' || t.step_type === 'finality')) return 'done'
  if (stageId === 'simulation' && hasUnsignedTx) return 'done'
  if (stageId === 'approval' && (phase === 'wallet' || phase === 'waiting' || traces.some((t) => t.step_type === 'wallet_signed'))) {
    return phase === 'waiting' || traces.some((t) => t.step_type === 'wallet_signed') ? 'done' : 'active'
  }
  if (stageId === 'building' && hasUnsignedTx) return 'done'
  if (stageId === 'validators' && traces.some((t) => t.message?.toLowerCase().includes('validator'))) return 'done'
  if (stageId === 'compliance' && traces.some((t) => t.message?.toLowerCase().includes('compliance'))) return 'done'
  if (stageId === 'contracts' && traces.some((t) => t.step_type === 'tool_invoked' || t.step_type === 'tool_selected')) return 'done'

  const phaseMap: Partial<Record<RuntimePhase, number>> = {
    thinking: 0,
    selecting: 1,
    calling: 5,
    analyzing: 6,
    wallet: 7,
    waiting: 7,
    broadcast: 8,
    finalized: 10,
    complete: 10,
  }

  const activeIdx = phaseMap[phase]
  if (activeIdx !== undefined) {
    if (stageIndex < activeIdx) return 'done'
    if (stageIndex === activeIdx) return 'active'
  }

  if (phase !== 'idle' && stageIndex === 0) return phase === 'thinking' ? 'active' : 'done'

  return 'pending'
}

function StatusIcon({ status, index }: { status: StageStatus; index: number }) {
  const colors = {
    pending: meridianTokens.color.textMuted,
    active: meridianTokens.color.accent,
    done: meridianTokens.color.success,
    error: meridianTokens.color.error,
  }

  return (
    <motion.div
      animate={status === 'active' ? { scale: [1, 1.06, 1] } : {}}
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
          bgcolor: status === 'pending' ? 'rgba(255,255,255,0.05)' : `${colors[status]}22`,
          border: '2px solid',
          borderColor: colors[status],
          color: colors[status],
          fontSize: 13,
          fontWeight: 700,
          zIndex: 1,
        }}
      >
        {status === 'done' ? (
          <IconifyIcon icon="mdi:check" width={16} />
        ) : status === 'error' ? (
          <IconifyIcon icon="mdi:alert" width={16} />
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
  const [expanded, setExpanded] = useState<string | false>(false)

  const sessionTraces = useMemo(
    () => (sessionId ? traces.filter((t) => t.session_id === sessionId) : traces.slice(-40)),
    [traces, sessionId],
  )

  const progress = useMemo(() => {
    if (phase === 'idle') return 0
    if (phase === 'complete') return 100
    const done = PIPELINE_STAGES.filter((s) =>
      resolveStageStatus(s.id, phase, sessionTraces, txHash, Boolean(unsignedTx)) === 'done',
    ).length
    return Math.min(95, Math.round((done / PIPELINE_STAGES.length) * 100))
  }, [phase, sessionTraces, txHash, unsignedTx])

  if (phase === 'idle') return <></>

  return (
    <GlassCard
      padding={3}
      sx={{
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
            Agent pipeline
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

      <Stack direction="row" alignItems="center" gap={2} mb={3}>
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            flex: 1,
            height: 6,
            borderRadius: 3,
            bgcolor: 'rgba(255,255,255,0.06)',
            '& .MuiLinearProgress-bar': {
              borderRadius: 3,
              bgcolor: meridianTokens.color.accent,
            },
          }}
        />
        <Typography variant="caption" color="text.secondary" fontWeight={600} minWidth={36}>
          {progress}%
        </Typography>
      </Stack>

      <Box sx={{ flex: 1, overflow: 'auto', pr: 0.5, mr: -0.5 }}>
        <Stack gap={1.25} position="relative">
          <Box
            aria-hidden
            sx={{
              position: 'absolute',
              left: 17,
              top: 24,
              bottom: 24,
              width: 2,
              bgcolor: 'rgba(255,255,255,0.08)',
              borderRadius: 1,
            }}
          />
          <AnimatePresence>
            {PIPELINE_STAGES.map((stage, index) => {
              const status = resolveStageStatus(stage.id, phase, sessionTraces, txHash, Boolean(unsignedTx))
              const stageTraces = sessionTraces.filter((t) => stage.traceTypes.includes(t.step_type))
              const isExpanded = expanded === stage.id
              const hasDetails =
                (stage.id === 'planning' && reasoning) ||
                (stage.id === 'simulation' && unsignedTx) ||
                stageTraces.length > 0 ||
                (stage.id === 'explorer' && txHash) ||
                (steps.length > 0 && ['contracts', 'building'].includes(stage.id))

              return (
                <motion.div
                  key={stage.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03, ...meridianTokens.motion.spring }}
                >
                  <Accordion
                    expanded={isExpanded}
                    onChange={() => setExpanded(isExpanded ? false : stage.id)}
                    disabled={!hasDetails}
                    disableGutters
                    elevation={0}
                    sx={{
                      borderRadius: `${meridianTokens.radius.md}px !important`,
                      overflow: 'hidden',
                      ...panelSurfaceSx({
                        nested: true,
                        spark: status === 'active',
                      }),
                      ...(status === 'active'
                        ? { borderColor: 'rgba(153,27,27,0.45)' }
                        : status === 'done'
                          ? { borderColor: 'rgba(34,197,94,0.28)' }
                          : {}),
                      '&:before': { display: 'none' },
                    }}
                  >
                    <AccordionSummary
                      expandIcon={
                        hasDetails ? <IconifyIcon icon="mdi:chevron-down" width={18} /> : null
                      }
                      sx={{
                        minHeight: 64,
                        px: 1.5,
                        '& .MuiAccordionSummary-content': { my: 1.25, alignItems: 'center' },
                        '&.Mui-disabled': { opacity: 1 },
                      }}
                    >
                      <Stack direction="row" gap={2} alignItems="center" width="100%">
                        <StatusIcon status={status} index={index} />
                        <Box flex={1} minWidth={0}>
                          <Typography
                            variant="subtitle2"
                            fontWeight={600}
                            color={
                              status === 'active'
                                ? 'primary.main'
                                : status === 'done'
                                  ? 'success.main'
                                  : 'text.primary'
                            }
                          >
                            {stage.label}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" mt={0.25} lineHeight={1.45}>
                            {stage.human}
                          </Typography>
                        </Box>
                      </Stack>
                    </AccordionSummary>
                    {hasDetails ? (
                      <AccordionDetails sx={{ pt: 0, pb: 2, pl: 7.5, pr: 2 }}>
                        {stage.id === 'planning' && reasoning ? (
                          <Typography variant="body2" color="text.secondary" mb={1.5} lineHeight={1.55}>
                            {reasoning}
                          </Typography>
                        ) : null}
                        {stage.id === 'simulation' && unsignedTx ? (
                          <Typography variant="body2" color="text.secondary" mb={1.5}>
                            Transaction ready: {unsignedTx.note ?? 'unsigned deploy'}
                          </Typography>
                        ) : null}
                        {stageTraces.map((t) => (
                          <Typography
                            key={t.id}
                            variant="body2"
                            color="text.disabled"
                            fontSize={13}
                            lineHeight={1.5}
                            mb={0.5}
                          >
                            {t.message}
                          </Typography>
                        ))}
                        {stage.id === 'explorer' && txHash ? (
                          <Link href={explorerTxUrl(txHash)} target="_blank" variant="body2" sx={{ mt: 0.5 }}>
                            View on testnet.cspr.live
                          </Link>
                        ) : null}
                        {steps.length > 0 && ['contracts', 'building'].includes(stage.id) ? (
                          <Typography
                            variant="caption"
                            color="text.disabled"
                            component="pre"
                            sx={{ mt: 1, fontFamily: meridianTokens.typography.fontFamilyMono, lineHeight: 1.5 }}
                          >
                            {steps.map((s) => `${s.kind}: ${s.tool}`).join('\n')}
                          </Typography>
                        ) : null}
                      </AccordionDetails>
                    ) : null}
                  </Accordion>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </Stack>
      </Box>

      {error ? (
        <Box
          sx={{
            mt: 2,
            p: 2,
            borderRadius: 2,
            bgcolor: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
          }}
        >
          <Typography variant="body2" color="error.light">
            {error}
          </Typography>
        </Box>
      ) : null}
    </GlassCard>
  )
}
