import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

type TxBuilder = {
  buildTransferToken(c: string, r: string, a: string): unknown
  buildRegisterHolder(c: string, h: string, a: string): unknown
  buildRevokeHolder(c: string, h: string, r: string): unknown
  buildDelegateStake(c: string, v: string, a: string): unknown
  buildDepositToVault(c: string, a: string): unknown
  buildRestake(c: string, f: string, t: string, a: string): unknown
  buildDistributeRewards(c: string, e: number): unknown
}

let builderPromise: Promise<TxBuilder> | null = null

async function getBuilder(): Promise<TxBuilder> {
  if (!builderPromise) {
    builderPromise = (async () => {
      const addresses = JSON.parse(
        await readFile(join(process.cwd(), '../deployed/addresses.json'), 'utf8'),
      ) as { chain_name: string }
      const { TransactionBuilder } = require('../../../mcp-server/dist/casper/tx-builder.js') as {
        TransactionBuilder: new (chain: string, addresses: unknown) => TxBuilder
      }
      return new TransactionBuilder(addresses.chain_name, addresses)
    })()
  }
  return builderPromise
}

function argString(args: Record<string, unknown>, key: string, fallback = ''): string {
  const value = args[key]
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return fallback
}

const WRITE_TOOLS = new Set([
  'transfer_token',
  'register_holder',
  'revoke_holder',
  'delegate_stake',
  'deposit_to_vault',
  'restake',
  'distribute_rewards',
])

export async function invokeWriteTool(
  tool: string,
  args: Record<string, unknown>,
): Promise<unknown> {
  if (!WRITE_TOOLS.has(tool)) {
    throw new Error(`unsupported_write_tool:${tool}`)
  }

  const builder = await getBuilder()
  const callerPublicKey = argString(args, 'callerPublicKey')

  switch (tool) {
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
        argString(args, 'attestationBytes', '00'),
      )
    case 'revoke_holder':
      return builder.buildRevokeHolder(
        callerPublicKey,
        argString(args, 'holderAccountHash'),
        argString(args, 'reason', 'policy violation'),
      )
    case 'delegate_stake':
      return builder.buildDelegateStake(
        callerPublicKey,
        argString(args, 'validator'),
        argString(args, 'amount'),
      )
    case 'deposit_to_vault':
      return builder.buildDepositToVault(callerPublicKey, argString(args, 'amount'))
    case 'restake':
      return builder.buildRestake(
        callerPublicKey,
        argString(args, 'fromValidator'),
        argString(args, 'toValidator'),
        argString(args, 'amount'),
      )
    case 'distribute_rewards':
      return builder.buildDistributeRewards(callerPublicKey, Number(args.eraId ?? 0))
    default:
      throw new Error(`unsupported_write_tool:${tool}`)
  }
}
