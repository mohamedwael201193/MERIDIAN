import { NextRequest, NextResponse } from 'next/server';

const RESOURCES: Record<string, string> = {
  'yield-rate': '/api/yield-rate',
  'validator-performance': '/api/validator-performance',
  'sanctions-merkle': '/api/sanctions-merkle',
};

function getX402Url(): string {
  return (
    process.env.X402_FACILITATOR_URL ??
    process.env.NEXT_PUBLIC_X402_FACILITATOR_URL ??
    'https://meridian-x402-facilitator.onrender.com'
  );
}

export async function GET(
  request: NextRequest,
  context: { params: { resource: string } },
) {
  const { resource } = context.params;
  const path = RESOURCES[resource];
  if (!path) {
    return NextResponse.json({ error: { message: 'Unknown x402 resource' } }, { status: 404 });
  }

  const paymentHeader = request.headers.get('x-payment') ?? undefined;

  try {
    const res = await fetch(`${getX402Url()}${path}`, {
      headers: paymentHeader ? { 'X-Payment': paymentHeader } : undefined,
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json(
      { error: { message: error instanceof Error ? error.message : 'x402 resource request failed' } },
      { status: 503 },
    );
  }
}
