import { NextRequest, NextResponse } from 'next/server'
import { PublicKey, PurseIdentifier } from 'casper-js-sdk'
import { createCasperRpcClient } from '@lib/server/casper-rpc'

export async function GET(_request: NextRequest, context: { params: { publicKey: string } }) {
  try {
    const publicKey = PublicKey.fromHex(context.params.publicKey)
    const rpc = createCasperRpcClient()
    const result = await rpc.queryLatestBalance(PurseIdentifier.fromPublicKey(publicKey))

    return NextResponse.json({
      publicKey: context.params.publicKey,
      balanceMotes: result.balance.toString(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          message: error instanceof Error ? error.message : 'Failed to read account balance',
        },
      },
      { status: 502 },
    )
  }
}
