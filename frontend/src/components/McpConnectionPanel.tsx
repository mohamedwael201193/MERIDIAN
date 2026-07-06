'use client'

import { useEffect, useState, ReactElement } from 'react'
import { Alert, Box, Chip, Paper, Stack, Typography } from '@mui/material'
import { MCP_TOOLS, MCP_SERVER_URL } from '@lib/mcp-catalog'
import CopyButton from '@/components/CopyButton'

interface McpHealth {
  status: string
  tools: number
  toolNames?: string[]
}

export default function McpConnectionPanel(): ReactElement {
  const [health, setHealth] = useState<McpHealth | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch(`${MCP_SERVER_URL}/health`)
        if (!res.ok) throw new Error(`MCP health ${String(res.status)}`)
        setHealth((await res.json()) as McpHealth)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'MCP unreachable')
      }
    })()
  }, [])

  const cursorConfig = JSON.stringify(
    { mcpServers: { meridian: { url: `${MCP_SERVER_URL}/mcp` } } },
    null,
    2,
  )

  const claudeConfig = JSON.stringify(
    {
      mcpServers: {
        meridian: {
          url: `${MCP_SERVER_URL}/mcp`,
          transport: 'streamable-http',
        },
      },
    },
    null,
    2,
  )

  return (
    <Paper sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" color="common.white">
          MERIDIAN MCP Connection
        </Typography>
        {health ? (
          <Chip color="success" label={`✓ Connected · ${String(health.tools)} tools`} />
        ) : error ? (
          <Chip color="error" label="Disconnected" />
        ) : (
          <Chip label="Checking…" />
        )}
      </Stack>

      {error ? (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}

      {health ? (
        <Stack gap={2}>
          <Alert severity="success">
            ✓ MCP server online · ✓ {health.tools} tools found · ✓ Streamable HTTP at{' '}
            {MCP_SERVER_URL}/mcp
          </Alert>

          <Box>
            <Typography variant="subtitle2" color="common.white" mb={1}>
              Capabilities
            </Typography>
            <Stack direction="row" gap={1} flexWrap="wrap">
              <Chip
                size="small"
                label={`${MCP_TOOLS.filter((t) => t.kind === 'read').length} read tools`}
              />
              <Chip
                size="small"
                label={`${MCP_TOOLS.filter((t) => t.kind === 'write').length} write tools`}
              />
              <Chip size="small" label="x402 micropayments" />
              <Chip size="small" label="Planner Agent" />
              <Chip size="small" label="Live SSE timeline" />
            </Stack>
          </Box>

          <Stack direction={{ xs: 'column', md: 'row' }} gap={2}>
            <Box flex={1}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="subtitle2" color="common.white">
                  Cursor config
                </Typography>
                <CopyButton text={cursorConfig} label="Copy Cursor" />
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
                {cursorConfig}
              </Box>
            </Box>
            <Box flex={1}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="subtitle2" color="common.white">
                  Claude Desktop config
                </Typography>
                <CopyButton text={claudeConfig} label="Copy Claude" />
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
                {claudeConfig}
              </Box>
            </Box>
          </Stack>

          <Typography variant="caption" color="text.secondary">
            Install: copy config to Cursor MCP settings or Claude Desktop config. Verify with: curl{' '}
            {MCP_SERVER_URL}/health
          </Typography>
        </Stack>
      ) : null}
    </Paper>
  )
}
