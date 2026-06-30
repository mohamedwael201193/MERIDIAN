import { NextResponse } from 'next/server'
import { backendFetch } from '@lib/server/backend'
import type { ApiEnvelope, TokenRow } from '@lib/types'

export async function GET() {
  try {
    const data = await backendFetch<ApiEnvelope<TokenRow[]>>('/api/v1/tokens')
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: { message: error instanceof Error ? error.message : 'Failed to fetch tokens' } },
      { status: 503 },
    )
  }
}
