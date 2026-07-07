'use client'

import { useEffect, useState, ReactElement } from 'react'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Chip,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import IconifyIcon from '@/nickelfox/components/base/IconifyIcon'
import { MCP_SERVER_URL } from '@lib/mcp-catalog'
import CopyButton from '@/components/CopyButton'
import { updateAgentProfile } from '@lib/agent-profile'

type McpClient = 'cursor' | 'claude'

function buildMcpConfig(client: McpClient, mcpUrl: string): string {
  if (client === 'claude') {
    return JSON.stringify(
      { mcpServers: { meridian: { url: `${mcpUrl}/mcp`, transport: 'streamable-http' } } },
      null,
      2,
    )
  }
  return JSON.stringify({ mcpServers: { meridian: { url: `${mcpUrl}/mcp` } } }, null, 2)
}

export default function AgentInstaller({
  defaultClient = 'cursor',
}: {
  defaultClient?: McpClient
}): ReactElement {
  const [client, setClient] = useState<McpClient>(defaultClient)
  const [mcpUrl, setMcpUrl] = useState(MCP_SERVER_URL)
  const [toolCount, setToolCount] = useState<number | null>(null)
  const [checking, setChecking] = useState(false)
  const [validated, setValidated] = useState(false)

  const config = buildMcpConfig(client, mcpUrl)

  const verify = async () => {
    setChecking(true)
    try {
      const res = await fetch('/api/mcp/health')
      const body = (await res.json()) as { tools?: number; mcpUrl?: string }
      if (!res.ok) throw new Error('Connection failed')
      setMcpUrl(body.mcpUrl ?? MCP_SERVER_URL)
      setToolCount(body.tools ?? 0)
    } catch {
      setToolCount(null)
    } finally {
      setChecking(false)
    }
  }

  useEffect(() => {
    void verify()
  }, [])

  const confirm = () => {
    updateAgentProfile({ connectedMcpServers: [mcpUrl], installedSkills: ['meridian'] })
    setValidated(true)
  }

  return (
    <Stack gap={2.5}>
      <TextField
        select
        label="Which AI app do you use?"
        value={client}
        onChange={(e) => setClient(e.target.value as McpClient)}
        fullWidth
        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
      >
        <MenuItem value="cursor">Cursor</MenuItem>
        <MenuItem value="claude">Claude Desktop</MenuItem>
      </TextField>

      <Stack direction="row" gap={1} flexWrap="wrap">
        <CopyButton text={config} label="Copy connection" />
        <Button size="small" variant="outlined" sx={{ borderRadius: 3, textTransform: 'none' }} onClick={() => void verify()} disabled={checking}>
          {checking ? 'Checking…' : 'Test connection'}
        </Button>
        {toolCount != null ? (
          <Chip size="small" color="success" label={`Connected · ${String(toolCount)} capabilities`} />
        ) : (
          <Chip size="small" color="warning" label="Not connected yet" />
        )}
      </Stack>

      <Alert severity="info" sx={{ borderRadius: 3 }}>
        Paste the copied connection into your {client === 'cursor' ? 'Cursor' : 'Claude'} settings.
        We can't edit those files for you — that's normal and keeps your machine secure.
      </Alert>

      <Accordion
        sx={{ bgcolor: 'transparent', border: '1px solid', borderColor: 'divider', borderRadius: '16px !important', '&:before': { display: 'none' } }}
      >
        <AccordionSummary expandIcon={<IconifyIcon icon="mdi:chevron-down" />}>
          <Typography variant="body2" color="text.secondary">
            Technical details
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box component="pre" sx={{ p: 2, fontSize: 11, borderRadius: 2, bgcolor: '#0a0a0a', overflow: 'auto' }}>
            {config}
          </Box>
          <Button href="/meridian-skill.md" target="_blank" size="small" sx={{ mt: 1, textTransform: 'none' }}>
            Open agent guide
          </Button>
        </AccordionDetails>
      </Accordion>

      <Button
        variant="contained"
        size="large"
        disabled={toolCount == null}
        onClick={confirm}
        sx={{ borderRadius: 3, py: 1.5, textTransform: 'none', fontSize: 16 }}
      >
        I've pasted it — continue
      </Button>

      {validated ? (
        <Alert severity="success" sx={{ borderRadius: 3 }}>
          Connected. You're ready to chat on the home screen.
        </Alert>
      ) : null}
    </Stack>
  )
}
