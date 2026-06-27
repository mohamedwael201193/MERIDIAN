import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { spawn, type ChildProcess } from 'node:child_process'
import { resolve } from 'node:path'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'

const ROOT = resolve(import.meta.dirname, '../..')
const MCP_URL = process.env.MERIDIAN_MCP_HTTP_URL ?? 'http://127.0.0.1:3002/mcp'

function wait(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

describe.skipIf(process.env.SKIP_MCP_INTEGRATION === '1')('MCP HTTP integration', () => {
  let proc: ChildProcess | null = null
  let client: Client

  beforeAll(async () => {
    if ((await fetch(`${MCP_URL.replace('/mcp', '')}/health`).catch(() => null))?.ok) {
      client = new Client({ name: 'vitest', version: '0.1.0' })
      const transport = new StreamableHTTPClientTransport(new URL(MCP_URL))
      await client.connect(transport)
      return
    }

    proc = spawn('node', ['mcp-server/dist/index.js'], {
      cwd: ROOT,
      env: { ...process.env, MERIDIAN_MCP_TRANSPORT: 'http', MERIDIAN_MCP_PORT: '3002' },
      stdio: 'ignore',
    })
    for (let i = 0; i < 20; i += 1) {
      try {
        const res = await fetch('http://127.0.0.1:3002/health')
        if (res.ok) break
      } catch {
        /* retry */
      }
      await wait(500)
    }
    client = new Client({ name: 'vitest', version: '0.1.0' })
    const transport = new StreamableHTTPClientTransport(new URL(MCP_URL))
    await client.connect(transport)
  }, 60_000)

  afterAll(async () => {
    await client?.close()
    proc?.kill('SIGTERM')
  })

  it('discovers 12 tools', async () => {
    const tools = await client.listTools()
    expect(tools.tools).toHaveLength(12)
  })

  it('invokes get_yield_rate', async () => {
    const result = await client.callTool({ name: 'get_yield_rate', arguments: {} })
    expect(result.content.length).toBeGreaterThan(0)
  })
})
