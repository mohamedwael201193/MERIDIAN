'use client'

import { useState, ReactElement } from 'react'
import { Box, Button, Collapse, Stack, Typography } from '@mui/material'
import IconifyIcon from '@/nickelfox/components/base/IconifyIcon'
import type { HumanSummary } from '@lib/human-results'
import { meridianTokens } from '@/design/tokens'
import { panelSurfaceSx } from '@/design/surface'

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
        mb: 2.5,
        animation: 'fadeUp 0.35s ease-out',
        '@keyframes fadeUp': {
          from: { opacity: 0, transform: 'translateY(8px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
      }}
    >
      <Box
        sx={{
          maxWidth: '88%',
          px: 3,
          py: 2.5,
          borderRadius: isUser ? '20px 20px 6px 20px' : '20px 20px 20px 6px',
          ...(isUser
            ? {
                bgcolor: 'primary.main',
                boxShadow: '0 4px 20px rgba(153,27,27,0.25)',
              }
            : {
                borderRadius: '20px 20px 20px 6px',
                ...panelSurfaceSx({ nested: true }),
              }),
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
      <Typography variant="subtitle1" color="common.white" fontWeight={700} mb={1}>
        {summary.headline}
      </Typography>
      {reasoning ? (
        <Typography variant="body2" color="text.secondary" mb={1.5} lineHeight={1.55}>
          {reasoning}
        </Typography>
      ) : null}
      <Stack gap={0.75}>
        {summary.lines.map((line) => (
          <Typography key={line} variant="body2" color="text.secondary" lineHeight={1.55}>
            {line}
          </Typography>
        ))}
      </Stack>
      {summary.detail ? (
        <>
          <Button
            variant="outlined"
            color="inherit"
            size="small"
            onClick={() => setShowDetail((v) => !v)}
            startIcon={
              <IconifyIcon icon={showDetail ? 'mdi:chevron-up' : 'mdi:code-json'} width={16} />
            }
            sx={{
              mt: 2,
              textTransform: 'none',
              fontWeight: 600,
              color: 'common.white',
              borderColor: 'rgba(255,255,255,0.22)',
              bgcolor: 'rgba(255,255,255,0.04)',
              '&:hover': {
                borderColor: 'primary.main',
                bgcolor: 'rgba(153,27,27,0.12)',
              },
            }}
          >
            {showDetail ? 'Hide technical details' : 'View technical details'}
          </Button>
          <Collapse in={showDetail}>
            <Box
              component="pre"
              sx={{
                mt: 1.5,
                p: 2,
                fontSize: 12,
                lineHeight: 1.5,
                borderRadius: 2,
                bgcolor: '#0a0a0e',
                border: '1px solid rgba(255,255,255,0.08)',
                overflow: 'auto',
                maxHeight: 220,
                fontFamily: meridianTokens.typography.fontFamilyMono,
                color: meridianTokens.color.textSecondary,
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
