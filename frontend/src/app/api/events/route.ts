import { NextRequest, NextResponse } from 'next/server';
import { backendFetch } from '@lib/server/backend';
import type { ApiEnvelope, MeridianEventRow } from '@lib/types';

export async function GET(request: NextRequest) {
  try {
    const limit = request.nextUrl.searchParams.get('limit') ?? '50';
    const data = await backendFetch<ApiEnvelope<MeridianEventRow[]>>(
      `/api/v1/events?limit=${limit}`,
    );
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: { message: error instanceof Error ? error.message : 'Failed to fetch events' } },
      { status: 503 },
    );
  }
}
