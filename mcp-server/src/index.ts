#!/usr/bin/env node
import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import rateLimit from 'express-rate-limit'
import { Registry, Counter, collectDefaultMetrics } from 'prom-client'
import { loadAddresses, loadConfig } from './config.js'
import { createMcpServer } from './server.js'

const config = loadConfig()
const addresses = loadAddresses(config.MERIDIAN_CONTRACTS_PATH)

const metricsRegistry = new Registry()
collectDefaultMetrics({ register: metricsRegistry })
const toolCallsTotal = new Counter({
  name: 'meridian_mcp_tool_calls_total',
  help: 'MCP tool invocations',
  labelNames: ['tool', 'status'],
  registers: [metricsRegistry],
})

async function startStdio(): Promise<void> {
  const server = createMcpServer(config, addresses)
  const transport = new StdioServerTransport()
  await server.connect(transport)
}

async function startHttp(): Promise<void> {
  const app = createMcpExpressApp({ host: config.MERIDIAN_MCP_HOST })
  app.set('trust proxy', 1)

  app.get('/health', async (_req, res) => {
    res.json({ status: 'ok', transport: 'http', tools: 12, timestamp: new Date().toISOString() })
  })

  app.get('/metrics', async (_req, res) => {
    res.set('Content-Type', metricsRegistry.contentType)
    res.send(await metricsRegistry.metrics())
  })

  app.use(
    '/mcp',
    rateLimit({ windowMs: 60_000, max: 120, standardHeaders: true, legacyHeaders: false }),
  )

  const sessions = new Map<string, StreamableHTTPServerTransport>()

  app.post('/mcp', async (req, res) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined
    let transport = sessionId ? sessions.get(sessionId) : undefined

    if (!transport) {
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => crypto.randomUUID(),
        onsessioninitialized: (id) => {
          sessions.set(id, transport!)
        },
      })
      const server = createMcpServer(config, addresses)
      await server.connect(transport as Parameters<McpServer['connect']>[0])
    }

    await transport.handleRequest(req, res, req.body)
  })

  app.get('/mcp', async (req, res) => {
    const sessionId = req.headers['mcp-session-id'] as string
    const transport = sessions.get(sessionId)
    if (!transport) {
      res.status(400).json({ error: 'invalid session' })
      return
    }
    await transport.handleRequest(req, res)
  })

  app.delete('/mcp', async (req, res) => {
    const sessionId = req.headers['mcp-session-id'] as string
    const transport = sessions.get(sessionId)
    if (transport) {
      await transport.close()
      sessions.delete(sessionId)
    }
    res.status(204).end()
  })

  app.listen(config.MERIDIAN_MCP_PORT, config.MERIDIAN_MCP_HOST, () => {
    console.log(
      JSON.stringify({
        event: 'mcp_http_started',
        port: config.MERIDIAN_MCP_PORT,
        host: config.MERIDIAN_MCP_HOST,
      }),
    )
  })
}

async function main(): Promise<void> {
  if (config.MERIDIAN_MCP_TRANSPORT === 'http') {
    await startHttp()
  } else {
    await startStdio()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
