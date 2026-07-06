'use client'

import { useMemo, useState, ReactElement } from 'react'
import { Box, Chip, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material'
import PageHeader from '@/components/PageHeader'
import CopyButton from '@/components/CopyButton'
import {
  MASTER_AGENT_PROMPT,
  PROMPT_CATEGORIES,
  PROMPT_COUNT,
  PROMPT_LIBRARY,
  type PromptCategory,
} from '@lib/prompt-library'

export default function PromptsPage(): ReactElement {
  const [category, setCategory] = useState<PromptCategory | 'All'>('All')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    return PROMPT_LIBRARY.filter((item) => {
      if (category !== 'All' && item.category !== category) return false
      if (search && !item.prompt.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [category, search])

  return (
    <Box>
      <PageHeader
        icon="mdi:text-box-multiple-outline"
        eyebrow="Prompt Generator"
        title="Production Prompt Library"
        description={`${String(PROMPT_COUNT)} ready-to-use prompts for Claude, Cursor, and MERIDIAN MCP.`}
      />

      <Paper sx={{ p: 3, mb: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" color="common.white">
            Master Agent Prompt
          </Typography>
          <CopyButton text={MASTER_AGENT_PROMPT} label="Copy Master" />
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
          {MASTER_AGENT_PROMPT.slice(0, 400)}…
        </Typography>
      </Paper>

      <Stack direction={{ xs: 'column', sm: 'row' }} gap={2} mb={3}>
        <TextField
          select
          label="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value as PromptCategory | 'All')}
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="All">All</MenuItem>
          {PROMPT_CATEGORIES.map((c) => (
            <MenuItem key={c} value={c}>
              {c}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          fullWidth
          label="Search prompts"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Stack>

      <Stack gap={2}>
        {filtered.map((item, i) => (
          <Paper key={i} sx={{ p: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={2}>
              <Box flex={1}>
                <Chip size="small" label={item.category} sx={{ mb: 1 }} />
                <Typography variant="body1" color="common.white">
                  {item.prompt}
                </Typography>
              </Box>
              <CopyButton text={item.prompt} label="Copy" variant="icon" />
            </Stack>
          </Paper>
        ))}
      </Stack>
    </Box>
  )
}
