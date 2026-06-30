import { NextResponse } from 'next/server'
import { backendFetch } from '@lib/server/backend'
import type { BackendHealth } from '@lib/types'

export async function GET() {
  try {
    const data = await backendFetch<BackendHealth>('/health', { revalidate: 0 })
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: { message: error instanceof Error ? error.message : 'Health check failed' } },
      { status: 503 },
    )
  }
}
