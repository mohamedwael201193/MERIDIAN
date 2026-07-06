import { NextResponse } from 'next/server'

function mcpBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_MCP_SERVER_URL ??
    process.env.MERIDIAN_MCP_URL ??
    'https://meridian-mcp-server-94q4.onrender.com'
  )
}

export async function GET() {
  try {
    const res = await fetch(`${mcpBaseUrl()}/health`, {
      next: { revalidate: 30 },
    })
    const body: unknown = await res.json().catch(() => null)
    if (!res.ok) {
      return NextResponse.json(
        { error: { message: `MCP health returned ${String(res.status)}` }, data: body },
        { status: 503 },
      )
    }
    return NextResponse.json({ ...(body as Record<string, unknown>), mcpUrl: mcpBaseUrl() })
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          message: error instanceof Error ? error.message : 'Failed to reach MCP server',
        },
      },
      { status: 503 },
    )
  }
}
