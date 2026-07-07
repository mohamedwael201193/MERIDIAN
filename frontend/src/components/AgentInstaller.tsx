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
import { meridianTokens } from '@/design/tokens'

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
  onConfirmed,
}: {
  defaultClient?: McpClient
  onConfirmed?: () => void
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
    onConfirmed?.()
  }

  const connected = toolCount != null && toolCount > 0

  return (
    <Stack gap={3}>
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

      <Box
        sx={{
          p: 2.5,
          borderRadius: `${meridianTokens.radius.md}px`,
          bgcolor: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <Stack direction={{ xs: 'column', sm: 'row' }} gap={1.5} alignItems={{ sm: 'center' }} flexWrap="wrap">
          <CopyButton text={config} label="Copy connection" size="medium" />
          <Button
            variant="outlined"
            color="inherit"
            sx={{
              borderRadius: 3,
              textTransform: 'none',
              borderColor: 'rgba(255,255,255,0.2)',
              color: 'common.white',
              px: 2.5,
            }}
            onClick={() => void verify()}
            disabled={checking}
            startIcon={<IconifyIcon icon="mdi:lan-connect" width={18} />}
          >
            {checking ? 'Checking…' : 'Test connection'}
          </Button>
          {connected ? (
            <Chip
              size="medium"
              color="success"
              variant="outlined"
              label={`Connected · ${String(toolCount)} capabilities`}
              sx={{ fontWeight: 600 }}
            />
          ) : (
            <Chip size="medium" color="warning" variant="outlined" label="Not connected yet" />
          )}
        </Stack>
      </Box>

      <Alert
        severity="info"
        icon={<IconifyIcon icon="mdi:information-outline" width={20} />}
        sx={{
          borderRadius: `${meridianTokens.radius.md}px`,
          bgcolor: 'rgba(59,130,246,0.08)',
          border: '1px solid rgba(59,130,246,0.25)',
          color: 'text.secondary',
          '& .MuiAlert-icon': { color: '#60a5fa' },
        }}
      >
        Paste the copied connection into your {client === 'cursor' ? 'Cursor' : 'Claude'} settings.
        We can&apos;t edit those files for you — that keeps your machine secure.
      </Alert>

      <Accordion
        disableGutters
        elevation={0}
        sx={{
          bgcolor: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: `${meridianTokens.radius.md}px !important`,
          '&:before': { display: 'none' },
          '& .MuiAccordionSummary-root': { minHeight: 52 },
        }}
      >
        <AccordionSummary expandIcon={<IconifyIcon icon="mdi:chevron-down" width={20} />}>
          <Typography variant="body2" color="text.secondary" fontWeight={600}>
            Technical details
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ pt: 0 }}>
          <Box
            component="pre"
            sx={{
              p: 2,
              fontSize: 12,
              lineHeight: 1.5,
              borderRadius: 2,
              bgcolor: '#0a0a0e',
              border: '1px solid rgba(255,255,255,0.08)',
              overflow: 'auto',
              fontFamily: meridianTokens.typography.fontFamilyMono,
              color: meridianTokens.color.textSecondary,
            }}
          >
            {config}
          </Box>
          <Button
            href="/meridian-skill.md"
            target="_blank"
            variant="text"
            color="inherit"
            size="small"
            sx={{ mt: 1.5, textTransform: 'none', color: 'text.secondary' }}
            startIcon={<IconifyIcon icon="mdi:open-in-new" width={16} />}
          >
            Open agent guide
          </Button>
        </AccordionDetails>
      </Accordion>

      <Button
        variant="contained"
        size="large"
        fullWidth
        disabled={!connected}
        onClick={confirm}
        sx={{
          borderRadius: `${meridianTokens.radius.md}px`,
          py: 1.75,
          textTransform: 'none',
          fontSize: 16,
          fontWeight: 600,
          color: '#fff',
        }}
        endIcon={<IconifyIcon icon="mdi:arrow-right" width={20} />}
      >
        I&apos;ve pasted it — continue
      </Button>

      {validated ? (
        <Alert
          severity="success"
          sx={{
            borderRadius: `${meridianTokens.radius.md}px`,
            bgcolor: 'rgba(34,197,94,0.08)',
            border: '1px solid rgba(34,197,94,0.3)',
          }}
        >
          Connected. You&apos;re ready to chat on the briefing screen.
        </Alert>
      ) : null}
    </Stack>
  )
}
