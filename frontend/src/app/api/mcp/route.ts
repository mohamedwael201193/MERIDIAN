import { NextRequest, NextResponse } from 'next/server'
import { isWriteTool } from '@lib/server/mcp-tools'

type McpRequestBody = {
  tool: string
  arguments?: Record<string, unknown>
}

async function callRemoteMcpTool(tool: string, args: Record<string, unknown>) {
  const { callMcpTool } = await import('@lib/server/mcp')
  return callMcpTool(tool, args)
}

async function buildLocalWriteTool(tool: string, args: Record<string, unknown>) {
  const { buildWriteToolLocally } = await import('@lib/server/mcp-write-builder')
  return buildWriteToolLocally(tool as never, args)
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as McpRequestBody
    if (!body.tool) {
      return NextResponse.json({ error: { message: 'tool is required' } }, { status: 400 })
    }

    const args = body.arguments ?? {}

    if (isWriteTool(body.tool)) {
      try {
        const result = await buildLocalWriteTool(body.tool, args)
        return NextResponse.json({ result })
      } catch (localError) {
        const detail = localError instanceof Error ? localError.message : 'local MCP build failed'
        try {
          const result = await callRemoteMcpTool(body.tool, args)
          return NextResponse.json({ result })
        } catch (remoteError) {
          const remoteDetail =
            remoteError instanceof Error ? remoteError.message : 'remote MCP call failed'
          throw new Error(`${detail}; remote fallback: ${remoteDetail}`)
        }
      }
    }

    const result = await callRemoteMcpTool(body.tool, args)
    return NextResponse.json({ result })
  } catch (error) {
    return NextResponse.json(
      { error: { message: error instanceof Error ? error.message : 'MCP tool call failed' } },
      { status: 503 },
    )
  }
}
