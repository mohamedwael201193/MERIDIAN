import { NextRequest, NextResponse } from 'next/server'
import { callMcpTool } from '@lib/server/mcp'
import { buildWriteToolLocally, isWriteTool } from '@lib/server/mcp-write-builder'

type McpRequestBody = {
  tool: string
  arguments?: Record<string, unknown>
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as McpRequestBody
    if (!body.tool) {
      return NextResponse.json({ error: { message: 'tool is required' } }, { status: 400 })
    }

    if (isWriteTool(body.tool)) {
      const result = await buildWriteToolLocally(body.tool, body.arguments ?? {})
      return NextResponse.json({ result })
    }

    const result = await callMcpTool(body.tool, body.arguments ?? {})
    return NextResponse.json({ result })
  } catch (error) {
    return NextResponse.json(
      { error: { message: error instanceof Error ? error.message : 'MCP tool call failed' } },
      { status: 503 },
    )
  }
}
