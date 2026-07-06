import 'server-only'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { TransactionBuilder } = require('../../../mcp-server/dist/casper/tx-builder.js') as {
  TransactionBuilder: new (
    chainName: string,
    addresses: unknown,
  ) => {
    buildIssueToken(caller: string, symbol: string, supply: string): unknown
    buildTransferToken(caller: string, recipient: string, amount: string): unknown
    buildRegisterHolder(caller: string, holder: string, attestation: string): unknown
    buildRevokeHolder(caller: string, holder: string, reason: string): unknown
    buildRestake(caller: string, from: string, to: string, amount: string): unknown
    buildDistributeRewards(caller: string, eraId: number): unknown
  }
}

import { isWriteTool, WRITE_TOOL_NAMES, type WriteToolName } from './mcp-tools'

export { isWriteTool, WRITE_TOOL_NAMES, type WriteToolName }

async function loadAddresses() {
  return JSON.parse(await readFile(join(process.cwd(), '../deployed/addresses.json'), 'utf8')) as {
    chain_name: string
  }
}

function argString(args: Record<string, unknown>, key: string, fallback = ''): string {
  const value = args[key]
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return fallback
}

export async function buildWriteToolLocally(
  tool: WriteToolName,
  args: Record<string, unknown>,
): Promise<unknown> {
  const addresses = await loadAddresses()
  const builder = new TransactionBuilder(addresses.chain_name, addresses)
  const callerPublicKey = argString(args, 'callerPublicKey')

  switch (tool) {
    case 'issue_token':
      return builder.buildIssueToken(
        callerPublicKey,
        argString(args, 'symbol', 'MRWA'),
        argString(args, 'initialSupply'),
      )
    case 'transfer_token':
      return builder.buildTransferToken(
        callerPublicKey,
        argString(args, 'recipientAccountHash'),
        argString(args, 'amount'),
      )
    case 'register_holder':
      return builder.buildRegisterHolder(
        callerPublicKey,
        argString(args, 'holderAccountHash'),
        argString(args, 'attestationBytes'),
      )
    case 'revoke_holder':
      return builder.buildRevokeHolder(
        callerPublicKey,
        argString(args, 'holderAccountHash'),
        argString(args, 'reason'),
      )
    case 'restake':
      return builder.buildRestake(
        callerPublicKey,
        argString(args, 'fromValidator'),
        argString(args, 'toValidator'),
        argString(args, 'amount'),
      )
    case 'distribute_rewards':
      return builder.buildDistributeRewards(callerPublicKey, Number(args.eraId ?? 0))
    default: {
      const unknownTool: string = tool
      throw new Error(`Unknown write tool: ${unknownTool}`)
    }
  }
}
