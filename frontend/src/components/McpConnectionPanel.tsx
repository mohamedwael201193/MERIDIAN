'use client'

import { useEffect, useState, ReactElement } from 'react'
import { Alert, Box, Chip, Stack, Typography } from '@mui/material'
import { MCP_TOOLS, MCP_SERVER_URL } from '@lib/mcp-catalog'
import CopyButton from '@/components/CopyButton'
import PremiumButton from '@/design/components/PremiumButton'
import IconifyIcon from '@/nickelfox/components/base/IconifyIcon'
import { meridianTokens } from '@/design/tokens'

interface McpHealth {
  status: string
  tools: number
  toolNames?: string[]
  mcpUrl?: string
}

export default function McpConnectionPanel(): ReactElement {
  const [health, setHealth] = useState<McpHealth | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [checking, setChecking] = useState(true)

  const mcpUrl = health?.mcpUrl ?? MCP_SERVER_URL

  const checkHealth = async () => {
    setChecking(true)
    setError(null)
    try {
      const res = await fetch('/api/mcp/health')
      const body = (await res.json()) as McpHealth & { error?: { message?: string } }
      if (!res.ok) {
        throw new Error(body.error?.message ?? `MCP health ${String(res.status)}`)
      }
      setHealth(body)
    } catch (err) {
      setHealth(null)
      setError(err instanceof Error ? err.message : 'MCP unreachable')
    } finally {
      setChecking(false)
    }
  }

  useEffect(() => {
    void checkHealth()
  }, [])

  const cursorConfig = JSON.stringify(
    { mcpServers: { meridian: { url: `${mcpUrl}/mcp` } } },
    null,
    2,
  )

  const claudeConfig = JSON.stringify(
    {
      mcpServers: {
        meridian: {
          url: `${mcpUrl}/mcp`,
          transport: 'streamable-http',
        },
      },
    },
    null,
    2,
  )

  const codeBlockSx = {
    p: 2,
    bgcolor: '#0a0a0e',
    borderRadius: `${meridianTokens.radius.md}px`,
    fontSize: 12,
    lineHeight: 1.6,
    overflow: 'auto',
    border: '1px solid',
    borderColor: meridianTokens.surface.panelBorder,
    fontFamily: meridianTokens.typography.mono.fontFamily,
    m: 0,
  }

  return (
    <Stack gap={2.5}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1.5}>
        <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
          {health ? (
            <Chip
              size="small"
              color="success"
              icon={<IconifyIcon icon="mdi:check-circle" width={14} />}
              label={`Connected · ${String(health.tools)} tools`}
            />
          ) : checking ? (
            <Chip size="small" label="Checking…" />
          ) : (
            <Chip size="small" color="warning" label="Unreachable" />
          )}
          <Typography variant="caption" color="text.disabled" sx={{ fontFamily: meridianTokens.typography.mono.fontFamily }}>
            {mcpUrl}/mcp
          </Typography>
        </Stack>
        <PremiumButton size="small" variant="outlined" icon="mdi:refresh" loading={checking} onClick={() => void checkHealth()}>
          Refresh
        </PremiumButton>
      </Stack>

      {error ? (
        <Alert severity="warning">
          {error}. Config below is still valid — MCP may be cold-starting on Render (wait 30s and refresh).
        </Alert>
      ) : null}

      {health ? (
        <Alert severity="success">
          MCP server online with streamable HTTP transport.
        </Alert>
      ) : null}

      <Box>
        <Typography variant="subtitle2" color="common.white" mb={1}>
          Capabilities
        </Typography>
        <Stack direction="row" gap={1} flexWrap="wrap">
          <Chip size="small" variant="outlined" label={`${MCP_TOOLS.filter((t) => t.kind === 'read').length} read`} color="success" />
          <Chip size="small" variant="outlined" label={`${MCP_TOOLS.filter((t) => t.kind === 'write').length} write`} color="error" />
          <Chip size="small" variant="outlined" label="x402 micropayments" />
          <Chip size="small" variant="outlined" label="Planner Agent" />
        </Stack>
      </Box>

      <Stack direction={{ xs: 'column', md: 'row' }} gap={2}>
        <Box flex={1}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="subtitle2" color="common.white">
              Cursor config
            </Typography>
            <CopyButton text={cursorConfig} label="Copy" />
          </Stack>
          <Box component="pre" sx={codeBlockSx}>
            {cursorConfig}
          </Box>
        </Box>
        <Box flex={1}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="subtitle2" color="common.white">
              Claude Desktop config
            </Typography>
            <CopyButton text={claudeConfig} label="Copy" />
          </Stack>
          <Box component="pre" sx={codeBlockSx}>
            {claudeConfig}
          </Box>
        </Box>
      </Stack>

      <Typography variant="caption" color="text.secondary">
        Copy into Cursor MCP settings or Claude Desktop config. Verify with: curl {mcpUrl}/health
      </Typography>
    </Stack>
  )
}
