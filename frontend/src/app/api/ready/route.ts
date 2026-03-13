import { NextResponse } from 'next/server';
import { backendFetch } from '@lib/server/backend';

export async function GET() {
  try {
    const data = await backendFetch<Record<string, unknown>>('/ready', { revalidate: 0 });
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: { message: error instanceof Error ? error.message : 'Readiness check failed' } },
      { status: 503 },
    );
  }
}
