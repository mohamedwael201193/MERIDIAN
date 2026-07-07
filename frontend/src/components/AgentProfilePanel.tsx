'use client'

import { useEffect, useState, ReactElement } from 'react'
import { Box, Chip, Paper, Stack, TextField, Typography } from '@mui/material'
import { loadAgentProfile, saveAgentProfile, type AgentProfile } from '@lib/agent-profile'
import { getTemplateById } from '@lib/agent-marketplace'

export default function AgentProfilePanel(): ReactElement {
  const [profile, setProfile] = useState<AgentProfile | null>(null)

  useEffect(() => {
    setProfile(loadAgentProfile())
  }, [])

  if (!profile) return <Box />

  const template = profile.activeTemplateId
    ? getTemplateById(profile.activeTemplateId)
    : undefined

  const updateName = (name: string) => {
    const next = { ...profile, name }
    saveAgentProfile(next)
    setProfile(next)
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" color="common.white" mb={2}>
        Agent Profile
      </Typography>
      <Stack gap={2}>
        <TextField
          label="Agent name"
          value={profile.name}
          onChange={(e) => updateName(e.target.value)}
          fullWidth
          size="small"
        />
        <Stack direction="row" gap={1} flexWrap="wrap">
          <Chip
            size="small"
            label={profile.walletPublicKey ? `Wallet ${profile.walletPublicKey.slice(0, 10)}…` : 'No wallet'}
            color={profile.walletPublicKey ? 'success' : 'default'}
          />
          <Chip size="small" label={`Missions: ${String(profile.missionsCompleted)}`} />
          <Chip size="small" label={`Planner: ${profile.planner}`} />
          {template ? <Chip size="small" color="primary" label={template.name} /> : null}
        </Stack>
        {profile.installedSkills.length > 0 ? (
          <Typography variant="caption" color="text.secondary">
            Skills: {profile.installedSkills.join(', ')}
          </Typography>
        ) : null}
        {profile.connectedMcpServers.length > 0 ? (
          <Typography variant="caption" color="text.secondary">
            MCP: {profile.connectedMcpServers.join(', ')}
          </Typography>
        ) : null}
        {profile.memory.length > 0 ? (
          <Box>
            <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
              Memory
            </Typography>
            {profile.memory.slice(0, 3).map((m, i) => (
              <Typography key={i} variant="body2" color="text.secondary">
                • {m}
              </Typography>
            ))}
          </Box>
        ) : null}
      </Stack>
    </Paper>
  )
}
