'use client'

import { useState, ReactElement } from 'react'
import { Box, Button, Collapse, Stack, Typography } from '@mui/material'
import type { HumanSummary } from '@lib/human-results'

interface ChatBubbleProps {
  role: 'user' | 'agent'
  children: React.ReactNode
}

export function ChatBubble({ role, children }: ChatBubbleProps): ReactElement {
  const isUser = role === 'user'
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        mb: 2,
        animation: 'fadeUp 0.35s ease-out',
        '@keyframes fadeUp': {
          from: { opacity: 0, transform: 'translateY(8px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
      }}
    >
      <Box
        sx={{
          maxWidth: '85%',
          px: 2.5,
          py: 2,
          borderRadius: isUser ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
          bgcolor: isUser ? 'primary.main' : 'rgba(255,255,255,0.06)',
          border: isUser ? 'none' : '1px solid',
          borderColor: 'divider',
        }}
      >
        {children}
      </Box>
    </Box>
  )
}

export function ResultBubble({
  summary,
  reasoning,
}: {
  summary: HumanSummary
  reasoning?: string | null
}): ReactElement {
  const [showDetail, setShowDetail] = useState(false)
  return (
    <ChatBubble role="agent">
      <Typography variant="subtitle1" color="common.white" fontWeight={600} mb={1}>
        {summary.headline}
      </Typography>
      {reasoning ? (
        <Typography variant="body2" color="text.secondary" mb={1.5}>
          {reasoning}
        </Typography>
      ) : null}
      <Stack gap={0.5}>
        {summary.lines.map((line) => (
          <Typography key={line} variant="body2" color="text.secondary">
            {line}
          </Typography>
        ))}
      </Stack>
      {summary.detail ? (
        <>
          <Button
            size="small"
            sx={{ mt: 1.5, textTransform: 'none', color: 'text.disabled' }}
            onClick={() => setShowDetail((v) => !v)}
          >
            {showDetail ? 'Hide details' : 'View technical details'}
          </Button>
          <Collapse in={showDetail}>
            <Box
              component="pre"
              sx={{
                mt: 1,
                p: 1.5,
                fontSize: 11,
                borderRadius: 2,
                bgcolor: '#0a0a0a',
                overflow: 'auto',
                maxHeight: 200,
              }}
            >
              {JSON.stringify(summary.detail, null, 2)}
            </Box>
          </Collapse>
        </>
      ) : null}
    </ChatBubble>
  )
}
