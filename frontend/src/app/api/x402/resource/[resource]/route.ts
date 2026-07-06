import { NextRequest, NextResponse } from 'next/server'
import { buildX402PaymentRequired } from '@lib/server/x402-config'

const RESOURCES: Record<string, string> = {
  'yield-rate': '/api/yield-rate',
}

export async function GET(request: NextRequest, context: { params: { resource: string } }) {
  const { resource } = context.params
  const path = RESOURCES[resource]
  if (!path) {
    return NextResponse.json({ error: { message: 'Unknown x402 resource' } }, { status: 404 })
  }

  const paymentHeader = request.headers.get('x-payment') ?? undefined

  if (!paymentHeader) {
    return NextResponse.json(buildX402PaymentRequired(path), { status: 402 })
  }

  try {
    const payment = JSON.parse(paymentHeader) as unknown
    const { settleX402Payment, getPaidResourceData } = await import('@lib/server/x402-local')
    const settle = await settleX402Payment(payment as never)
    if (!settle.success) {
      return NextResponse.json({ error: 'settlement_failed', detail: settle }, { status: 402 })
    }

    const data = await getPaidResourceData(resource)
    return NextResponse.json({ data, settlement: settle.transactionHash })
  } catch (error) {
    return NextResponse.json(
      {
        error: { message: error instanceof Error ? error.message : 'x402 resource request failed' },
      },
      { status: 503 },
    )
  }
}
