'use client'

import { ReactElement } from 'react'
import { Box, Chip, Stack, Typography } from '@mui/material'
import { STARTER_PROMPTS } from '@lib/starter-prompts'

export default function SuggestionChips({
  onSelect,
  disabled,
}: {
  onSelect: (objective: string) => void
  disabled?: boolean
}): ReactElement {
  return (
    <Stack direction="row" gap={1} flexWrap="wrap" justifyContent="center" mb={2}>
      {STARTER_PROMPTS.map((p) => (
        <Chip
          key={p.id}
          label={p.label}
          clickable
          disabled={disabled}
          onClick={() => onSelect(p.objective)}
          sx={{
            borderRadius: 4,
            px: 0.5,
            py: 2.5,
            fontSize: 14,
            bgcolor: 'rgba(255,255,255,0.05)',
            border: '1px solid',
            borderColor: 'divider',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
          }}
        />
      ))}
    </Stack>
  )
}

export function EmptyState({
  onSetup,
  installed,
}: {
  onSetup?: () => void
  installed: boolean
}): ReactElement {
  if (!installed) {
    return (
      <Box textAlign="center" py={6} px={2}>
        <Typography variant="h4" color="common.white" fontWeight={700} mb={1}>
          Welcome to MERIDIAN
        </Typography>
        <Typography variant="body1" color="text.secondary" mb={3} maxWidth={420} mx="auto">
          Your AI agent for Casper. Ask anything about yield, staking, or compliance — in plain
          English.
        </Typography>
        <Chip
          label="Set up in 2 minutes →"
          clickable
          color="primary"
          onClick={onSetup}
          sx={{ borderRadius: 4, px: 2, py: 2.5, fontSize: 15, fontWeight: 600 }}
        />
      </Box>
    )
  }

  return (
    <Box textAlign="center" py={5} px={2}>
      <Typography variant="h5" color="common.white" fontWeight={600} mb={1}>
        Ready when you are
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>
        Tap a suggestion or type your objective below.
      </Typography>
    </Box>
  )
}
