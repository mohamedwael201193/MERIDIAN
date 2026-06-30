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

export const WRITE_TOOL_NAMES = [
  'issue_token',
  'transfer_token',
  'register_holder',
  'revoke_holder',
  'restake',
  'distribute_rewards',
] as const

export type WriteToolName = (typeof WRITE_TOOL_NAMES)[number]

export function isWriteTool(tool: string): tool is WriteToolName {
  return (WRITE_TOOL_NAMES as readonly string[]).includes(tool)
}

async function loadAddresses() {
  return JSON.parse(await readFile(join(process.cwd(), '../deployed/addresses.json'), 'utf8')) as {
    chain_name: string
  }
}

export async function buildWriteToolLocally(
  tool: WriteToolName,
  args: Record<string, unknown>,
): Promise<unknown> {
  const addresses = await loadAddresses()
  const builder = new TransactionBuilder(addresses.chain_name, addresses)
  const callerPublicKey = String(args.callerPublicKey ?? '')

  switch (tool) {
    case 'issue_token':
      return builder.buildIssueToken(
        callerPublicKey,
        String(args.symbol ?? 'MRWA'),
        String(args.initialSupply ?? ''),
      )
    case 'transfer_token':
      return builder.buildTransferToken(
        callerPublicKey,
        String(args.recipientAccountHash ?? ''),
        String(args.amount ?? ''),
      )
    case 'register_holder':
      return builder.buildRegisterHolder(
        callerPublicKey,
        String(args.holderAccountHash ?? ''),
        String(args.attestationBytes ?? ''),
      )
    case 'revoke_holder':
      return builder.buildRevokeHolder(
        callerPublicKey,
        String(args.holderAccountHash ?? ''),
        String(args.reason ?? ''),
      )
    case 'restake':
      return builder.buildRestake(
        callerPublicKey,
        String(args.fromValidator ?? ''),
        String(args.toValidator ?? ''),
        String(args.amount ?? ''),
      )
    case 'distribute_rewards':
      return builder.buildDistributeRewards(callerPublicKey, Number(args.eraId ?? 0))
    default:
      throw new Error(`Unknown write tool: ${tool}`)
  }
}
