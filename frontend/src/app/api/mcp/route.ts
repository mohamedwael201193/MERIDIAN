import { NextRequest, NextResponse } from 'next/server';
import { callMcpTool } from '@lib/server/mcp';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { tool: string; arguments?: Record<string, unknown> };
    if (!body.tool) {
      return NextResponse.json({ error: { message: 'tool is required' } }, { status: 400 });
    }
    const result = await callMcpTool(body.tool, body.arguments ?? {});
    return NextResponse.json({ result });
  } catch (error) {
    return NextResponse.json(
      { error: { message: error instanceof Error ? error.message : 'MCP tool call failed' } },
      { status: 503 },
    );
  }
}
