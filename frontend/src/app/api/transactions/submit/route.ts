import { NextRequest, NextResponse } from 'next/server'
import { Transaction } from 'casper-js-sdk'
import {
  createCasperRpcClient,
  formatTransactionHash,
  getCasperRpcUrl,
} from '@lib/server/casper-rpc'

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Failed to submit transaction'
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { transaction?: unknown }
    if (!body.transaction) {
      return NextResponse.json({ error: { message: 'transaction is required' } }, { status: 400 })
    }

    const transaction = Transaction.fromJSON(body.transaction)
    const rpc = createCasperRpcClient()
    const result = await rpc.putTransaction(transaction)

    return NextResponse.json({
      transactionHash: formatTransactionHash(result.transactionHash),
      rpcUrl: getCasperRpcUrl(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          message: errorMessage(error),
        },
      },
      { status: 502 },
    )
  }
}
