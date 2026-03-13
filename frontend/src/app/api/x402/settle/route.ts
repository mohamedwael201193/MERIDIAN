import { NextRequest, NextResponse } from 'next/server';

function getX402Url(): string {
  return (
    process.env.X402_FACILITATOR_URL ??
    process.env.NEXT_PUBLIC_X402_FACILITATOR_URL ??
    'https://meridian-x402-facilitator.onrender.com'
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const res = await fetch(`${getX402Url()}/settle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json(
      { error: { message: error instanceof Error ? error.message : 'Settle failed' } },
      { status: 503 },
    );
  }
}
