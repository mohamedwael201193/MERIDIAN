import { NextRequest, NextResponse } from 'next/server'
import {
  getPaidResourceData,
  getX402Amount,
  getX402Network,
  getX402PayTo,
  settleX402Payment,
  type PaymentPayload,
} from '@lib/server/x402-local'

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

  try {
    if (!paymentHeader) {
      return NextResponse.json(
        {
          x402Version: 1,
          accepts: [
            {
              scheme: 'exact',
              network: getX402Network(),
              maxAmountRequired: getX402Amount(),
              resource: path,
              payTo: getX402PayTo(),
              asset: 'CSPR',
            },
          ],
        },
        { status: 402 },
      )
    }

    const payment = JSON.parse(paymentHeader) as PaymentPayload
    const settle = await settleX402Payment(payment)
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
