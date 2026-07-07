'use client'

import { useCallback, useEffect, useRef, useState, ReactElement } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Box, Grid, Typography } from '@mui/material'
import { useAgentRuntime } from '@lib/hooks/useAgentRuntime'
import { useWalletActions } from '@lib/hooks/useWalletActions'
import { useAgentTraceStream } from '@lib/hooks/useAgentTraceStream'
import { loadAgentProfile, updateAgentProfile } from '@lib/agent-profile'
import { formatPlannerStep } from '@lib/human-results'
import { explorerTxUrl } from '@lib/contracts'
import { meridianTokens } from '@/design/tokens'
import StatusRibbon from '@/design/components/StatusRibbon'
import BriefingHeader from '@/design/components/BriefingHeader'
import BriefingGrid from '@/design/components/BriefingGrid'
import AgentPipeline from '@/design/components/AgentPipeline'
import CommandBar from '@/design/components/CommandBar'
import WalletExecutionPanel from '@/design/components/WalletExecutionPanel'
import { ChatBubble, ResultBubble } from '@/components/agent/ChatBubble'
import SuggestionChips from '@/components/agent/SuggestionChips'
import ApprovalPrompt, { SuccessBanner } from '@/components/agent/ApprovalPrompt'
import TransactionStatus from '@/components/TransactionStatus'
import AgentEmployeeCard from '@/design/components/AgentEmployeeCard'
import { SPECIALIST_AGENTS } from '@lib/starter-prompts'
import { useDecisions } from '@lib/hooks/useMeridianData'

type ChatItem =
  | { id: string; type: 'user'; text: string }
  | { id: string; type: 'result'; tool: string; reasoning: string | null; result: unknown }
  | { id: string; type: 'error'; text: string }
  | { id: string; type: 'success'; subtitle: string; explorerHref?: string }

export default function AgentHomePage(): ReactElement {
  const router = useRouter()
  const searchParams = useSearchParams()
  const wallet = useWalletActions()
  const runtime = useAgentRuntime()
  const { traces } = useAgentTraceStream()
  const decisions = useDecisions(30)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatItem[]>([])
  const [installed, setInstalled] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const queryHandled = useRef(false)

  const showPipeline = runtime.phase !== 'idle'
  const hasConversation = messages.length > 0 || showPipeline

  useEffect(() => {
    const profile = loadAgentProfile()
    setInstalled(profile.installedSkills.includes('meridian'))
  }, [])

  useEffect(() => {
    if (queryHandled.current) return
    const objective = searchParams.get('objective')
    if (objective) {
      queryHandled.current = true
      void send(objective)
    }
  })

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, runtime.unsignedTx, runtime.txHash, runtime.phase])

  useEffect(() => {
    void (async () => {
      const pk = await wallet.getPublicKey()
      if (pk) updateAgentProfile({ walletPublicKey: pk })
    })()
  }, [wallet])

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || runtime.loading) return

      setInput('')
      setMessages((m) => [...m, { id: crypto.randomUUID(), type: 'user', text: trimmed }])

      const outcome = await runtime.execute(trimmed)

      setMessages((m) => {
        if (!outcome.ok) {
          return [...m, { id: crypto.randomUUID(), type: 'error', text: outcome.error }]
        }
        const results: ChatItem[] = outcome.result.steps
          .filter((s) => s.kind === 'read' && s.result != null)
          .map((s) => ({
            id: crypto.randomUUID(),
            type: 'result' as const,
            tool: s.tool,
            reasoning: outcome.result.reasoning,
            result: s.result,
          }))
        return [...m, ...results]
      })
    },
    [runtime],
  )

  const onFinalized = useCallback(async () => {
    const hash = runtime.txHash
    if (!hash) return
    await runtime.onTxFinalized()
    setMessages((m) => [
      ...m,
      {
        id: crypto.randomUUID(),
        type: 'success',
        subtitle: 'Transaction finalized on Casper testnet. Backend reads have been refreshed.',
        explorerHref: explorerTxUrl(hash),
      },
    ])
  }, [runtime])

  const agentStatus = (id: string): 'active' | 'idle' | 'attention' => {
    const related = decisions.data?.filter((d) => d.agent_name.toLowerCase().includes(id))
    if (related?.some((d) => d.approved === null)) return 'attention'
    if (related && related.length > 0) return 'active'
    return 'idle'
  }

  return (
    <Box
      sx={{
        maxWidth: meridianTokens.spacing.pageMax,
        mx: 'auto',
        px: { xs: 0, sm: 1 },
        minHeight: 'calc(100vh - 120px)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <StatusRibbon />
      <BriefingHeader />
      <BriefingGrid
        unsignedTxPending={Boolean(runtime.unsignedTx)}
        runtimePhase={runtime.phase}
      />
      <WalletExecutionPanel
        phase={runtime.phase}
        unsignedTxPending={Boolean(runtime.unsignedTx)}
        txHash={runtime.txHash}
      />

      {!installed ? (
        <Box textAlign="center" py={2} mb={2}>
          <Typography variant="body2" color="text.secondary" mb={1}>
            Complete setup to unlock the full agent operating system.
          </Typography>
          <Typography
            component="button"
            variant="body2"
            color="primary.main"
            onClick={() => router.push('/start')}
            sx={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
          >
            Open setup wizard
          </Typography>
        </Box>
      ) : null}

      <Grid container spacing={3} flex={1}>
        <Grid item xs={12} lg={showPipeline ? 7 : 12}>
          <Box ref={scrollRef} sx={{ maxHeight: hasConversation ? '50vh' : 'auto', overflow: 'auto', pb: 2 }}>
            {!hasConversation && installed ? (
              <>
                <Typography variant="subtitle2" color="text.secondary" mb={2}>
                  Specialist agents
                </Typography>
                <Grid container spacing={2} mb={3}>
                  {SPECIALIST_AGENTS.slice(0, 4).map((agent) => (
                    <Grid item xs={12} md={6} xl={3} key={agent.id}>
                      <AgentEmployeeCard
                        agent={{
                          ...agent,
                          capabilities: [...agent.capabilities],
                          status: agentStatus(agent.id),
                        }}
                        onAssign={(o) => void send(o)}
                      />
                    </Grid>
                  ))}
                </Grid>
                <SuggestionChips onSelect={(o) => void send(o)} />
              </>
            ) : null}

            {messages.map((msg) => {
              if (msg.type === 'user') {
                return (
                  <ChatBubble key={msg.id} role="user">
                    <Typography variant="body1" color="common.white">
                      {msg.text}
                    </Typography>
                  </ChatBubble>
                )
              }
              if (msg.type === 'error') {
                return (
                  <ChatBubble key={msg.id} role="agent">
                    <Typography color="error.light" variant="body2">
                      {msg.text}
                    </Typography>
                  </ChatBubble>
                )
              }
              if (msg.type === 'result') {
                const summary = formatPlannerStep(msg.tool, msg.result)
                return <ResultBubble key={msg.id} summary={summary} reasoning={msg.reasoning} />
              }
              if (msg.type === 'success') {
                return (
                  <SuccessBanner
                    key={msg.id}
                    subtitle={msg.subtitle}
                    explorerHref={msg.explorerHref}
                  />
                )
              }
              return null
            })}

            {runtime.unsignedTx ? (
              <ApprovalPrompt
                transaction={runtime.unsignedTx}
                loading={runtime.loading}
                onApprove={() => void runtime.signAndContinue()}
              />
            ) : null}

            {runtime.txHash ? (
              <TransactionStatus
                transactionHash={runtime.txHash}
                onFinalized={() => void onFinalized()}
              />
            ) : null}
          </Box>
        </Grid>

        {showPipeline ? (
          <Grid item xs={12} lg={5}>
            <AgentPipeline
              phase={runtime.phase}
              reasoning={runtime.reasoning}
              traces={traces}
              sessionId={runtime.sessionId}
              txHash={runtime.txHash}
              error={runtime.error}
              unsignedTx={runtime.unsignedTx}
              steps={runtime.steps}
            />
          </Grid>
        ) : null}
      </Grid>

      <CommandBar
        value={input}
        onChange={setInput}
        onSubmit={() => void send(input)}
        loading={runtime.loading}
        disabled={!installed}
      />
    </Box>
  )
}
