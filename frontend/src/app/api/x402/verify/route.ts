import { NextRequest, NextResponse } from 'next/server'
import { verifyX402Payment, type PaymentPayload } from '@lib/server/x402-local'

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { payment?: PaymentPayload; network?: string }
    if (!body.payment) {
      return NextResponse.json({ valid: false, reason: 'payment_required' }, { status: 400 })
    }

    return NextResponse.json(verifyX402Payment(body.payment, body.network))
  } catch (error) {
    return NextResponse.json(
      { error: { message: error instanceof Error ? error.message : 'Verify failed' } },
      { status: 503 },
    )
  }
}
