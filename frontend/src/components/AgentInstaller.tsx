'use client'

import { useEffect, useState, ReactElement } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  MenuItem,
  Paper,
  Stack,
  Step,
  StepContent,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from '@mui/material'
import { MCP_SERVER_URL, MCP_TOOLS } from '@lib/mcp-catalog'
import CopyButton from '@/components/CopyButton'
import { updateAgentProfile } from '@lib/agent-profile'

type McpClient = 'cursor' | 'claude' | 'vscode'
type OsHint = 'macos' | 'windows' | 'linux' | 'unknown'

const CLIENT_PATHS: Record<McpClient, Record<OsHint, string>> = {
  cursor: {
    macos: '~/.cursor/mcp.json',
    windows: '%USERPROFILE%\\.cursor\\mcp.json',
    linux: '~/.cursor/mcp.json',
    unknown: '~/.cursor/mcp.json',
  },
  claude: {
    macos: '~/Library/Application Support/Claude/claude_desktop_config.json',
    windows: '%APPDATA%\\Claude\\claude_desktop_config.json',
    linux: '~/.config/Claude/claude_desktop_config.json',
    unknown: 'Claude Desktop config directory (varies by OS)',
  },
  vscode: {
    macos: '.vscode/mcp.json (workspace) or user settings',
    windows: '.vscode/mcp.json (workspace) or user settings',
    linux: '.vscode/mcp.json (workspace) or user settings',
    unknown: '.vscode/mcp.json',
  },
}

const SKILL_PATHS: Record<OsHint, string> = {
  macos: '~/.cursor/skills/meridian/SKILL.md or project .cursor/skills/meridian/SKILL.md',
  windows: '%USERPROFILE%\\.cursor\\skills\\meridian\\SKILL.md',
  linux: '~/.cursor/skills/meridian/SKILL.md',
  unknown: '.cursor/skills/meridian/SKILL.md in your project',
}

function detectOs(): OsHint {
  if (typeof navigator === 'undefined') return 'unknown'
  const ua = navigator.userAgent.toLowerCase()
  const platform = navigator.platform?.toLowerCase() ?? ''
  if (platform.includes('mac') || ua.includes('mac')) return 'macos'
  if (platform.includes('win') || ua.includes('win')) return 'windows'
  if (platform.includes('linux') || ua.includes('linux')) return 'linux'
  return 'unknown'
}

function buildMcpConfig(client: McpClient, mcpUrl: string): string {
  if (client === 'claude') {
    return JSON.stringify(
      {
        mcpServers: {
          meridian: { url: `${mcpUrl}/mcp`, transport: 'streamable-http' },
        },
      },
      null,
      2,
    )
  }
  return JSON.stringify({ mcpServers: { meridian: { url: `${mcpUrl}/mcp` } } }, null, 2)
}

interface InstallStep {
  label: string
  status: 'pending' | 'active' | 'done' | 'warning'
  detail?: string
}

export default function AgentInstaller(): ReactElement {
  const [client, setClient] = useState<McpClient>('cursor')
  const [os] = useState<OsHint>(detectOs)
  const [mcpUrl, setMcpUrl] = useState(MCP_SERVER_URL)
  const [health, setHealth] = useState<{ tools: number; status: string } | null>(null)
  const [healthError, setHealthError] = useState<string | null>(null)
  const [checking, setChecking] = useState(false)
  const [installed, setInstalled] = useState(false)
  const [activeStep, setActiveStep] = useState(0)

  const config = buildMcpConfig(client, mcpUrl)

  const verifyMcp = async () => {
    setChecking(true)
    setHealthError(null)
    try {
      const res = await fetch('/api/mcp/health')
      const body = (await res.json()) as {
        tools?: number
        status?: string
        mcpUrl?: string
        error?: { message?: string }
      }
      if (!res.ok) throw new Error(body.error?.message ?? `Health check ${String(res.status)}`)
      setMcpUrl(body.mcpUrl ?? MCP_SERVER_URL)
      setHealth({ tools: body.tools ?? 0, status: body.status ?? 'ok' })
      setActiveStep(2)
    } catch (err) {
      setHealth(null)
      setHealthError(err instanceof Error ? err.message : 'MCP unreachable')
    } finally {
      setChecking(false)
    }
  }

  useEffect(() => {
    void verifyMcp()
  }, [])

  const markInstalled = () => {
    updateAgentProfile({
      connectedMcpServers: [mcpUrl],
      installedSkills: ['meridian'],
    })
    setInstalled(true)
    setActiveStep(3)
  }

  const downloadConfig = () => {
    const blob = new Blob([config], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = client === 'claude' ? 'claude_desktop_config.snippet.json' : 'mcp.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const steps: InstallStep[] = [
    {
      label: 'Detect environment',
      status: 'done',
      detail: `Browser: ${os}. MCP clients (Cursor, Claude Desktop) run outside the browser — auto-write to their config files is blocked by OS security.`,
    },
    {
      label: 'Select MCP client',
      status: activeStep >= 1 ? 'done' : 'active',
      detail: CLIENT_PATHS[client][os],
    },
    {
      label: 'Verify MCP connectivity',
      status: health ? 'done' : healthError ? 'warning' : checking ? 'active' : 'pending',
      detail: health
        ? `${String(health.tools)} tools discovered at ${mcpUrl}`
        : healthError ?? undefined,
    },
    {
      label: 'Install config + MERIDIAN Skill',
      status: installed ? 'done' : activeStep >= 3 ? 'active' : 'pending',
      detail: SKILL_PATHS[os],
    },
  ]

  return (
    <Paper sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" color="common.white">
          Install MERIDIAN
        </Typography>
        {health ? (
          <Chip color="success" label={`✓ ${String(health.tools)} MCP tools`} />
        ) : (
          <Chip color="warning" label={checking ? 'Verifying…' : 'Not verified'} />
        )}
      </Stack>

      <Alert severity="info" sx={{ mb: 3 }}>
        Browsers cannot write to Cursor or Claude Desktop config files. MERIDIAN generates the
        correct config, verifies connectivity server-side, and guides manual installation — this is
        not a failed auto-install.
      </Alert>

      <Stepper activeStep={activeStep} orientation="vertical" sx={{ mb: 3 }}>
        {steps.map((step) => (
          <Step key={step.label} completed={step.status === 'done'}>
            <StepLabel
              error={step.status === 'warning'}
              optional={
                step.detail ? (
                  <Typography variant="caption" color="text.secondary">
                    {step.detail}
                  </Typography>
                ) : undefined
              }
            >
              {step.label}
            </StepLabel>
            <StepContent />
          </Step>
        ))}
      </Stepper>

      <Stack gap={2}>
        <TextField
          select
          label="MCP client"
          value={client}
          onChange={(e) => {
            setClient(e.target.value as McpClient)
            setActiveStep(1)
          }}
          fullWidth
        >
          <MenuItem value="cursor">Cursor</MenuItem>
          <MenuItem value="claude">Claude Desktop</MenuItem>
          <MenuItem value="vscode">VS Code (workspace)</MenuItem>
        </TextField>

        <Alert severity="warning">
          Config file path ({client}): <strong>{CLIENT_PATHS[client][os]}</strong>
        </Alert>

        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="subtitle2" color="common.white">
            Generated MCP config
          </Typography>
          <Stack direction="row" gap={1}>
            <CopyButton text={config} label="Copy Config" />
            <Button size="small" variant="outlined" onClick={downloadConfig}>
              Download
            </Button>
          </Stack>
        </Stack>

        <Box
          component="pre"
          sx={{
            p: 2,
            bgcolor: '#0a0a0a',
            borderRadius: 1,
            fontSize: 12,
            overflow: 'auto',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          {config}
        </Box>

        <Stack direction="row" gap={1} flexWrap="wrap">
          <Button variant="outlined" onClick={() => void verifyMcp()} disabled={checking}>
            {checking ? 'Verifying…' : 'Verify MCP'}
          </Button>
          <Button
            variant="contained"
            onClick={markInstalled}
            disabled={!health}
          >
            I installed config — validate
          </Button>
          <Button
            variant="text"
            href="/meridian-skill.md"
            target="_blank"
            component="a"
          >
            Open MERIDIAN Skill
          </Button>
        </Stack>

        {health ? (
          <Alert severity="success">
            ✓ MCP online · ✓ {health.tools} tools ({MCP_TOOLS.map((t) => t.name).join(', ')})
          </Alert>
        ) : healthError ? (
          <Alert severity="warning">
            {healthError}. Render MCP may be cold-starting — wait 30s and click Verify MCP. Config
            above is still valid.
          </Alert>
        ) : null}

        {installed ? (
          <Alert severity="success">
            Installation validated. MERIDIAN Skill path: {SKILL_PATHS[os]}. Copy{' '}
            <code>skills/MERIDIAN/SKILL.md</code> from the repo or use the linked skill file.
          </Alert>
        ) : null}
      </Stack>
    </Paper>
  )
}
