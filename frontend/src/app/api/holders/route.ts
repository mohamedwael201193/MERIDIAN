import { NextRequest, NextResponse } from 'next/server'
import { backendFetch } from '@lib/server/backend'
import type { ApiEnvelope, HolderRow } from '@lib/types'

export async function GET(request: NextRequest) {
  try {
    const limit = request.nextUrl.searchParams.get('limit') ?? '100'
    const data = await backendFetch<ApiEnvelope<HolderRow[]>>(`/api/v1/holders?limit=${limit}`)
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: { message: error instanceof Error ? error.message : 'Failed to fetch holders' } },
      { status: 503 },
    )
  }
}
