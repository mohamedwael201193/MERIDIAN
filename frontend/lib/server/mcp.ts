import 'server-only'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'

function getMcpUrl(): string {
  return (
    process.env.NEXT_PUBLIC_MCP_SERVER_URL ??
    process.env.MERIDIAN_MCP_URL ??
    'https://meridian-mcp-server-94q4.onrender.com'
  )
}

let clientPromise: Promise<Client> | null = null

async function getMcpClient(): Promise<Client> {
  if (!clientPromise) {
    clientPromise = (async () => {
      const client = new Client({ name: 'meridian-frontend', version: '1.0.0' })
      const transport = new StreamableHTTPClientTransport(new URL(`${getMcpUrl()}/mcp`))
      await client.connect(transport)
      return client
    })()
  }
  return clientPromise
}

export async function callMcpTool(
  tool: string,
  args: Record<string, unknown> = {},
): Promise<unknown> {
  const client = await getMcpClient()
  const result = await client.callTool({ name: tool, arguments: args })
  const content = Array.isArray(result.content) ? result.content : []
  const text = content.find((c) => c.type === 'text')
  if (!text || text.type !== 'text') {
    return result
  }
  try {
    return JSON.parse(text.text)
  } catch {
    return text.text
  }
}
