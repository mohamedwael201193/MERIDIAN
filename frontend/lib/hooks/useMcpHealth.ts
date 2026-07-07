'use client'

import useSWR from 'swr'

interface McpHealth {
  tools?: number
  status?: string
}

async function fetchMcpHealth(): Promise<McpHealth> {
  const res = await fetch('/api/mcp/health')
  const body = (await res.json()) as McpHealth
  if (!res.ok) throw new Error('MCP health check failed')
  return body
}

export function useMcpHealth() {
  return useSWR('mcp-health', fetchMcpHealth, { refreshInterval: 60_000 })
}
