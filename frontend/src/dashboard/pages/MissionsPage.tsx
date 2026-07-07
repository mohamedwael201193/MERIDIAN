'use client'

import { useMemo, useState, ReactElement } from 'react'
import { useRouter } from 'next/navigation'
import {
  Alert,
  Box,
  Button,
  Chip,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import {
  MISSION_CATEGORIES,
  MISSION_LIBRARY,
  MISSION_COUNT,
  type Mission,
  type MissionCategory,
} from '@lib/mission-library'
import PageHeader from '@/components/PageHeader'

export default function MissionsPage(): ReactElement {
  const router = useRouter()
  const [category, setCategory] = useState<MissionCategory | 'All'>('All')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    return MISSION_LIBRARY.filter((m) => {
      if (category !== 'All' && m.category !== category) return false
      const q = search.toLowerCase()
      if (q && !m.title.toLowerCase().includes(q) && !m.objective.toLowerCase().includes(q))
        return false
      return true
    })
  }, [category, search])

  const runMission = (mission: Mission) => {
    router.push(`/agent?objective=${encodeURIComponent(mission.objective)}`)
  }

  return (
    <Box>
      <PageHeader
        icon="mdi:target"
        eyebrow="Mission Library"
        title="Execute Missions"
        description={`${String(MISSION_COUNT)} production missions — each runs immediately through the Planner Agent.`}
      />

      <Alert severity="info" sx={{ mb: 3 }}>
        Missions replace the prompt library. Click Run to open the Agent Console with the planner
        objective pre-filled. No copy-paste required.
      </Alert>

      <Stack direction={{ xs: 'column', sm: 'row' }} gap={2} mb={3}>
        <TextField
          select
          label="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value as MissionCategory | 'All')}
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="All">All</MenuItem>
          {MISSION_CATEGORIES.map((c) => (
            <MenuItem key={c} value={c}>
              {c}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          fullWidth
          label="Search missions"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Stack>

      <Stack gap={2}>
        {filtered.map((mission) => (
          <Paper key={mission.id} sx={{ p: 3 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={2}>
              <Box flex={1}>
                <Stack direction="row" gap={1} mb={1} flexWrap="wrap">
                  <Chip size="small" label={mission.category} />
                  {mission.requiresWallet ? (
                    <Chip size="small" color="warning" label="Wallet" />
                  ) : null}
                  {mission.requiresX402 ? (
                    <Chip size="small" color="info" label="x402" />
                  ) : null}
                  <Chip size="small" variant="outlined" label={`~${String(mission.estimatedSteps)} steps`} />
                </Stack>
                <Typography variant="h6" color="common.white">
                  {mission.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" mt={0.5}>
                  {mission.description}
                </Typography>
                <Typography variant="caption" color="text.disabled" display="block" mt={1}>
                  Objective: {mission.objective}
                </Typography>
              </Box>
              <Button variant="contained" onClick={() => runMission(mission)} sx={{ flexShrink: 0 }}>
                Run Mission
              </Button>
            </Stack>
          </Paper>
        ))}
      </Stack>
    </Box>
  )
}
