import { NextResponse } from 'next/server';
import { backendFetch } from '@lib/server/backend';
import type { ApiEnvelope, ComplianceStatus } from '@lib/types';

export async function GET(
  _request: Request,
  context: { params: { accountHash: string } },
) {
  try {
    const { accountHash } = context.params;
    const data = await backendFetch<ApiEnvelope<ComplianceStatus>>(
      `/api/v1/holders/${encodeURIComponent(accountHash)}/compliance`,
    );
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: { message: error instanceof Error ? error.message : 'Compliance lookup failed' } },
      { status: 404 },
    );
  }
}
