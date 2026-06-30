import { NextRequest, NextResponse } from 'next/server'
import { settleX402Payment, type PaymentPayload } from '@lib/server/x402-local'

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { payment?: PaymentPayload }
    if (!body.payment) {
      return NextResponse.json({ success: false, reason: 'payment_required' }, { status: 400 })
    }

    const result = await settleX402Payment(body.payment)
    return NextResponse.json(result, { status: result.success ? 200 : 402 })
  } catch (error) {
    return NextResponse.json(
      { error: { message: error instanceof Error ? error.message : 'Settle failed' } },
      { status: 503 },
    )
  }
}
