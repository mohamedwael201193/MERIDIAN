import { NextRequest, NextResponse } from 'next/server'
import { backendFetch } from '@lib/server/backend'

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      objective: string
      callerPublicKey?: string
      callerAccountHash?: string
      sessionId?: string
    }
    const data = await backendFetch<{ data: unknown }>('/api/v1/planner/execute', {
      method: 'POST',
      body: JSON.stringify(body),
    })
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: { message: error instanceof Error ? error.message : 'Planner execution failed' } },
      { status: 422 },
    )
  }
}
