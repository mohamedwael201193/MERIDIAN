import { NextRequest, NextResponse } from 'next/server'
import { createCasperRpcClient } from '@lib/server/casper-rpc'

export async function GET(_request: NextRequest, context: { params: { hash: string } }) {
  try {
    const rpc = createCasperRpcClient()
    const info = await rpc.getTransactionByTransactionHash(context.params.hash)
    const execution = (info as { executionInfo?: { executionResult?: { errorMessage?: string } } })
      .executionInfo
    const result = execution?.executionResult

    if (result && 'errorMessage' in result && result.errorMessage) {
      return NextResponse.json({ status: 'failed', detail: String(result.errorMessage) })
    }

    if (execution) {
      return NextResponse.json({ status: 'processed' })
    }

    return NextResponse.json({ status: 'pending' })
  } catch {
    return NextResponse.json({ status: 'pending' })
  }
}
