import { NextRequest, NextResponse } from 'next/server'
import { backendFetch } from '@lib/server/backend'
import type { ApiEnvelope, AgentTraceRow } from '@lib/types'

export async function GET(request: NextRequest) {
  try {
    const limit = request.nextUrl.searchParams.get('limit') ?? '100'
    const sessionId = request.nextUrl.searchParams.get('sessionId')
    const query = sessionId
      ? `/api/v1/traces?limit=${limit}&sessionId=${encodeURIComponent(sessionId)}`
      : `/api/v1/traces?limit=${limit}`
    const data = await backendFetch<ApiEnvelope<AgentTraceRow[]>>(query)
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: { message: error instanceof Error ? error.message : 'Failed to fetch traces' } },
      { status: 503 },
    )
  }
}
