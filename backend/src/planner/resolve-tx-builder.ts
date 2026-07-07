import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const moduleDir = dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)

export type TxBuilder = {
  buildTransferToken(c: string, r: string, a: string): unknown
  buildRegisterHolder(c: string, h: string, a: string): unknown
  buildRevokeHolder(c: string, h: string, r: string): unknown
  buildDelegateStake(c: string, v: string, a: string): unknown
  buildDepositToVault(c: string, a: string): unknown
  buildRestake(c: string, f: string, t: string, a: string): unknown
  buildDistributeRewards(c: string, e: number): unknown
}

function resolveTxBuilderPath(): string {
  const repoRootFromDist = resolve(moduleDir, '../../..')
  const candidates = [
    resolve(repoRootFromDist, 'mcp-server/dist/casper/tx-builder.js'),
    resolve(process.cwd(), 'mcp-server/dist/casper/tx-builder.js'),
    resolve(moduleDir, '../../../mcp-server/dist/casper/tx-builder.js'),
    resolve(process.cwd(), '../mcp-server/dist/casper/tx-builder.js'),
  ]

  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate
  }

  throw new Error(
    `tx-builder module not found. Build mcp-server first (pnpm --filter @meridian/mcp-server run build). Tried: ${candidates.join(', ')}`,
  )
}

let builderPromise: Promise<TxBuilder> | null = null

export async function loadTxBuilder(chainName: string, addresses: unknown): Promise<TxBuilder> {
  if (!builderPromise) {
    builderPromise = Promise.resolve().then(() => {
      const modulePath = resolveTxBuilderPath()
      const { TransactionBuilder } = require(modulePath) as {
        TransactionBuilder: new (chain: string, addresses: unknown) => TxBuilder
      }
      return new TransactionBuilder(chainName, addresses)
    })
  }
  return builderPromise
}
