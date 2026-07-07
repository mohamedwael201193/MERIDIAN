'use client'

import { ReactElement } from 'react'
import { Box, Paper, Stack, Typography } from '@mui/material'
import { useAgentTraceStream } from '@lib/hooks/useAgentTraceStream'
import { loadAgentProfile } from '@lib/agent-profile'
import Link from 'next/link'

function formatWhen(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

export default function ActivityPage(): ReactElement {
  const { traces } = useAgentTraceStream()
  const profile = loadAgentProfile()

  const milestones = traces.filter((t) =>
    ['complete', 'finality', 'objective_received'].includes(t.step_type),
  )

  return (
    <Box maxWidth={720} mx="auto" px={{ xs: 2, sm: 3 }} py={4}>
      <Typography variant="h4" color="common.white" fontWeight={700} mb={0.5}>
        History
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={4}>
        {profile.missionsCompleted > 0
          ? `You've completed ${String(profile.missionsCompleted)} request${profile.missionsCompleted === 1 ? '' : 's'}.`
          : 'Your completed requests will appear here.'}
      </Typography>

      <Stack gap={2}>
        {profile.history.length > 0
          ? profile.history.map((h) => (
              <Paper
                key={h.sessionId}
                sx={{
                  p: 3,
                  borderRadius: 4,
                  bgcolor: 'rgba(255,255,255,0.03)',
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Typography variant="body1" color="common.white" mb={0.5}>
                  {h.objective}
                </Typography>
                <Typography variant="caption" color="text.disabled">
                  {formatWhen(h.completedAt)}
                </Typography>
              </Paper>
            ))
          : milestones.slice(0, 10).map((t) => (
              <Paper
                key={t.id}
                sx={{
                  p: 3,
                  borderRadius: 4,
                  bgcolor: 'rgba(255,255,255,0.03)',
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Typography variant="body2" color="common.white">
                  {t.message}
                </Typography>
                <Typography variant="caption" color="text.disabled">
                  {formatWhen(t.created_at)}
                </Typography>
              </Paper>
            ))}

        {profile.history.length === 0 && milestones.length === 0 ? (
          <Box textAlign="center" py={8}>
            <Typography variant="h6" color="text.secondary" mb={2}>
              No history yet
            </Typography>
            <Typography
              component={Link}
              href="/agent"
              variant="body1"
              color="primary.main"
              sx={{ textDecoration: 'none' }}
            >
              Go to Home and ask your first question →
            </Typography>
          </Box>
        ) : null}
      </Stack>
    </Box>
  )
}
