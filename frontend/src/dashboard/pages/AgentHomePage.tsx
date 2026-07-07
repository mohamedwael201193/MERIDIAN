'use client'

import { useCallback, useEffect, useRef, useState, ReactElement } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  Box,
  CircularProgress,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import IconifyIcon from '@/nickelfox/components/base/IconifyIcon'
import { useAgentRuntime } from '@lib/hooks/useAgentRuntime'
import { useWalletActions } from '@lib/hooks/useWalletActions'
import { loadAgentProfile, updateAgentProfile } from '@lib/agent-profile'
import { formatPlannerStep } from '@lib/human-results'
import { SPECIALIST_AGENTS } from '@lib/starter-prompts'
import { explorerTxUrl } from '@lib/contracts'
import { ChatBubble, ResultBubble } from '@/components/agent/ChatBubble'
import ThinkingIndicator from '@/components/agent/ThinkingIndicator'
import SuggestionChips, { EmptyState } from '@/components/agent/SuggestionChips'
import ApprovalPrompt, { SuccessBanner } from '@/components/agent/ApprovalPrompt'
import TransactionStatus from '@/components/TransactionStatus'

type ChatItem =
  | { id: string; type: 'user'; text: string }
  | { id: string; type: 'thinking' }
  | { id: string; type: 'result'; tool: string; reasoning: string | null; result: unknown }
  | { id: string; type: 'error'; text: string }
  | { id: string; type: 'success'; subtitle: string; explorerHref?: string }

export default function AgentHomePage(): ReactElement {
  const router = useRouter()
  const searchParams = useSearchParams()
  const wallet = useWalletActions()
  const runtime = useAgentRuntime()
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatItem[]>([])
  const [installed, setInstalled] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const queryHandled = useRef(false)

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
  }, [messages, runtime.unsignedTx, runtime.txHash])

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
      setMessages((m) => [
        ...m,
        { id: crypto.randomUUID(), type: 'user', text: trimmed },
        { id: 'thinking', type: 'thinking' },
      ])

      const outcome = await runtime.execute(trimmed)

      setMessages((m) => {
        const base = m.filter((x) => x.type !== 'thinking')
        if (!outcome.ok) {
          return [...base, { id: crypto.randomUUID(), type: 'error', text: outcome.error }]
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
        return [...base, ...results]
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
        subtitle: 'Your transaction is on Casper testnet.',
        explorerHref: explorerTxUrl(hash),
      },
    ])
  }, [runtime])

  const showEmpty = messages.length === 0 && !runtime.loading

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 120px)',
        maxWidth: 760,
        mx: 'auto',
        px: { xs: 2, sm: 3 },
      }}
    >
      <Box ref={scrollRef} sx={{ flex: 1, overflow: 'auto', py: 3 }}>
        {showEmpty ? (
          <>
            <EmptyState installed={installed} onSetup={() => router.push('/start')} />
            {installed ? <SuggestionChips onSelect={(o) => void send(o)} /> : null}
            {installed ? (
              <Stack direction="row" gap={1.5} justifyContent="center" flexWrap="wrap" mt={2}>
                {SPECIALIST_AGENTS.map((a) => (
                  <Box
                    key={a.id}
                    onClick={() => void send(a.objective)}
                    sx={{
                      px: 2.5,
                      py: 2,
                      borderRadius: 4,
                      bgcolor: 'rgba(255,255,255,0.04)',
                      border: '1px solid',
                      borderColor: 'divider',
                      cursor: 'pointer',
                      minWidth: 140,
                      textAlign: 'center',
                      transition: 'transform 0.2s, border-color 0.2s',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        borderColor: 'primary.main',
                      },
                    }}
                  >
                    <Typography fontSize={24} mb={0.5}>
                      {a.emoji}
                    </Typography>
                    <Typography variant="subtitle2" color="common.white">
                      {a.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {a.greeting}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            ) : null}
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
          if (msg.type === 'thinking') {
            return (
              <Box key={msg.id} mb={2}>
                <ThinkingIndicator />
              </Box>
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

      <Box sx={{ pb: 3, pt: 1 }}>
        {!showEmpty && messages.length < 6 ? (
          <SuggestionChips onSelect={(o) => void send(o)} disabled={runtime.loading} />
        ) : null}
        <TextField
          fullWidth
          multiline
          maxRows={4}
          placeholder="Ask anything about yield, staking, or compliance…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              void send(input)
            }
          }}
          disabled={runtime.loading}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 4,
              bgcolor: 'rgba(255,255,255,0.04)',
              fontSize: 16,
              py: 0.5,
            },
          }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  color="primary"
                  onClick={() => void send(input)}
                  disabled={runtime.loading || !input.trim()}
                  sx={{
                    bgcolor: 'primary.main',
                    color: '#fff',
                    '&:hover': { bgcolor: 'primary.dark' },
                    '&.Mui-disabled': { bgcolor: 'action.disabledBackground' },
                  }}
                >
                  {runtime.loading ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <IconifyIcon icon="mdi:arrow-up" width={20} />
                  )}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        <Typography variant="caption" color="text.disabled" textAlign="center" display="block" mt={1}>
          MERIDIAN never signs without your approval
        </Typography>
      </Box>
    </Box>
  )
}
