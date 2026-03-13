import { NextResponse } from 'next/server';
import { backendFetch } from '@lib/server/backend';
import type { ApiEnvelope, YieldInfo } from '@lib/types';

export async function GET(
  _request: Request,
  context: { params: { packageHash: string } },
) {
  try {
    const { packageHash } = context.params;
    const data = await backendFetch<ApiEnvelope<YieldInfo>>(
      `/api/v1/tokens/${encodeURIComponent(packageHash)}/yield`,
    );
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: { message: error instanceof Error ? error.message : 'Yield not found' } },
      { status: 404 },
    );
  }
}
