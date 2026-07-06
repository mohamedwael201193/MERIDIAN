import { NextRequest, NextResponse } from 'next/server'
import { getTransactionPollResult } from '@lib/server/casper-transaction-status'

export async function GET(_request: NextRequest, context: { params: { hash: string } }) {
  try {
    const result = await getTransactionPollResult(context.params.hash)
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      {
        status: 'pending',
        detail: error instanceof Error ? error.message : 'status_check_failed',
      },
      { status: 200 },
    )
  }
}
