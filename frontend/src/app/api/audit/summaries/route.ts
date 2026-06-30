import { NextRequest, NextResponse } from 'next/server'
import { backendFetch } from '@lib/server/backend'
import type { ApiEnvelope, AuditSummaryRow } from '@lib/types'

export async function GET(request: NextRequest) {
  try {
    const limit = request.nextUrl.searchParams.get('limit') ?? '20'
    const data = await backendFetch<ApiEnvelope<AuditSummaryRow[]>>(
      `/api/v1/audit/summaries?limit=${limit}`,
    )
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          message: error instanceof Error ? error.message : 'Failed to fetch audit summaries',
        },
      },
      { status: 503 },
    )
  }
}
