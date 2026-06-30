import 'server-only'
import { HttpHandler, RpcClient } from 'casper-js-sdk'

export function formatTransactionHash(hash: unknown): string {
  if (typeof hash === 'string') return hash
  if (hash && typeof hash === 'object') {
    const withToHex = hash as { toHex?: () => string }
    if (typeof withToHex.toHex === 'function') return withToHex.toHex()
  }
  return String(hash)
}

function resolveRpcUrl(): string {
  const configured = process.env.CASPER_RPC_URL ?? process.env.NEXT_PUBLIC_CASPER_RPC_URL
  if (configured) return configured

  return 'https://node.testnet.cspr.cloud/rpc'
}

function resolveApiKey(): string | undefined {
  return (
    process.env.CASPER_API_KEY ??
    process.env.CSPR_CLOUD_AUTH_TOKEN ??
    process.env.NEXT_PUBLIC_CASPER_API_KEY
  )
}

export function createCasperRpcClient(): InstanceType<typeof RpcClient> {
  const handler = new HttpHandler(resolveRpcUrl(), 'fetch')
  const apiKey = resolveApiKey()
  if (apiKey) {
    handler.setCustomHeaders({ Authorization: apiKey })
  }
  return new RpcClient(handler)
}

export function getCasperRpcUrl(): string {
  return resolveRpcUrl()
}
