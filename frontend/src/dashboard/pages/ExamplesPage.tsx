'use client'

import { useMemo, useState, ReactElement } from 'react'
import { useRouter } from 'next/navigation'
import { Box, Chip, Grid, Stack, TextField, Typography } from '@mui/material'
import GlassCard from '@/design/components/GlassCard'
import PremiumButton from '@/design/components/PremiumButton'
import StatusRibbon from '@/design/components/StatusRibbon'
import { STARTER_PROMPTS, SPECIALIST_AGENTS } from '@lib/starter-prompts'
import { meridianTokens } from '@/design/tokens'

export default function ExamplesPage(): ReactElement {
  const router = useRouter()
  const [search, setSearch] = useState('')

  const examples = useMemo(() => {
    const all = [
      ...STARTER_PROMPTS.map((p) => ({ ...p, category: 'Quick start' })),
      ...SPECIALIST_AGENTS.map((a) => ({
        id: a.id,
        label: a.name,
        objective: a.objective,
        category: a.role,
      })),
    ]
    const q = search.toLowerCase()
    if (!q) return all
    return all.filter(
      (e) => e.label.toLowerCase().includes(q) || e.objective.toLowerCase().includes(q),
    )
  }, [search])

  const run = (objective: string) => {
    router.push(`/agent?objective=${encodeURIComponent(objective)}`)
  }

  return (
    <Box maxWidth={meridianTokens.spacing.pageMax} mx="auto">
      <StatusRibbon />
      <Typography sx={{ ...meridianTokens.typography.display, color: 'common.white', mb: 0.5 }}>
        Examples
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={3}>
        Sample objectives you can run immediately through the agent pipeline
      </Typography>

      <TextField
        fullWidth
        placeholder="Search examples…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{
          mb: 3,
          maxWidth: 480,
          '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: meridianTokens.color.glass },
        }}
      />

      <Grid container spacing={2}>
        {examples.map((ex) => (
          <Grid item xs={12} md={6} key={`${ex.id}-${ex.label}`}>
            <GlassCard hover padding={2.5}>
              <Stack gap={1.5}>
                <Chip size="small" label={ex.category} variant="outlined" sx={{ alignSelf: 'flex-start' }} />
                <Typography variant="h6" color="common.white" fontWeight={600}>
                  {ex.label}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {ex.objective}
                </Typography>
                <PremiumButton size="small" icon="mdi:play" onClick={() => run(ex.objective)}>
                  Run
                </PremiumButton>
              </Stack>
            </GlassCard>
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}
