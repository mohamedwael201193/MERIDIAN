import { NextRequest, NextResponse } from 'next/server'
import type { PaymentPayload } from '@lib/server/x402-local'

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { payment?: PaymentPayload; network?: string }
    if (!body.payment) {
      return NextResponse.json({ valid: false, reason: 'payment_required' }, { status: 400 })
    }

    const { verifyX402Payment } = await import('@lib/server/x402-local')
    return NextResponse.json(verifyX402Payment(body.payment, body.network))
  } catch (error) {
    return NextResponse.json(
      { error: { message: error instanceof Error ? error.message : 'Verify failed' } },
      { status: 503 },
    )
  }
}
