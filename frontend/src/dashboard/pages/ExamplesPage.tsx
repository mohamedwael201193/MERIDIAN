'use client'

import { useMemo, useState, ReactElement } from 'react'
import { useRouter } from 'next/navigation'
import { Box, Chip, Stack, TextField, Typography } from '@mui/material'
import GlassCard from '@/design/components/GlassCard'
import PremiumButton from '@/design/components/PremiumButton'
import PageHeader from '@/components/PageHeader'
import { meridianTokens } from '@/design/tokens'
import { STARTER_PROMPTS, SPECIALIST_AGENTS } from '@lib/starter-prompts'

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
    <Box>
      <PageHeader
        icon="mdi:lightbulb-on-outline"
        eyebrow="Examples"
        title="Examples"
        description="Sample objectives you can run immediately through the agent pipeline"
      />

      <TextField
        fullWidth
        placeholder="Search examples…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 3, maxWidth: 480 }}
      />

      <Box
        display="grid"
        gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }}
        gap={meridianTokens.spacing.panelGap}
      >
        {examples.map((ex) => (
          <GlassCard key={`${ex.id}-${ex.label}`} hover padding={meridianTokens.spacing.panelPadding}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              justifyContent="space-between"
              alignItems={{ xs: 'stretch', sm: 'center' }}
              gap={2}
            >
              <Box flex={1} minWidth={0}>
                <Chip size="small" label={ex.category} variant="outlined" sx={{ alignSelf: 'flex-start', mb: 1 }} />
                <Typography variant="h6" color="common.white" fontWeight={600}>
                  {ex.label}
                </Typography>
                <Typography variant="body2" color="text.secondary" mt={0.5}>
                  {ex.objective}
                </Typography>
              </Box>
              <PremiumButton
                size="small"
                variant="outlined"
                icon="mdi:play"
                onClick={() => run(ex.objective)}
                sx={{
                  flexShrink: 0,
                  alignSelf: { xs: 'flex-start', sm: 'center' },
                  minWidth: 'auto',
                  px: 1.75,
                  py: 0.625,
                  fontSize: 13,
                  fontWeight: 600,
                  borderRadius: `${meridianTokens.radius.sm}px`,
                  borderColor: 'rgba(220,38,38,0.4)',
                  color: 'primary.light',
                  boxShadow: 'none',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: 'rgba(220,38,38,0.08)',
                    boxShadow: 'none',
                  },
                }}
              >
                Run
              </PremiumButton>
            </Stack>
          </GlassCard>
        ))}
      </Box>
    </Box>
  )
}
