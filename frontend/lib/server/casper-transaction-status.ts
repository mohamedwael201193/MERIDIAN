import 'server-only'
import { createCasperRpcClient, getCasperRpcUrl } from './casper-rpc'

export type TransactionPollStatus = 'pending' | 'processed' | 'finalized' | 'failed'

export interface TransactionPollResult {
  status: TransactionPollStatus
  detail?: string
}

function normalizeHash(hash: string): string {
  return hash.replace(/^hash-/, '').replace(/^transaction-/, '')
}

async function infoGetTransaction(hash: string): Promise<Record<string, unknown> | null> {
  const rpcUrl = getCasperRpcUrl()
  const apiKey =
    process.env.CASPER_API_KEY ??
    process.env.CSPR_CLOUD_AUTH_TOKEN ??
    process.env.NEXT_PUBLIC_CASPER_API_KEY

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (apiKey) headers.Authorization = apiKey

  const response = await fetch(rpcUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'info_get_transaction',
      params: { transaction_hash: { Version1: normalizeHash(hash) } },
      id: 1,
    }),
    cache: 'no-store',
  })

  if (!response.ok) return null

  const body = (await response.json()) as {
    result?: Record<string, unknown>
    error?: { message?: string }
  }
  if (body.error || !body.result) return null
  return body.result
}

function asErrorText(value: unknown): string | null {
  if (value == null) return null
  if (typeof value === 'string') return value
  if (typeof value === 'object' && 'message' in value) {
    const message = (value as { message?: unknown }).message
    return typeof message === 'string' ? message : JSON.stringify(value)
  }
  return JSON.stringify(value)
}

function readErrorMessage(executionResult: Record<string, unknown>): string | null {
  const version2 = executionResult.Version2 as Record<string, unknown> | undefined
  const fromV2 = asErrorText(version2?.error_message)
  if (fromV2) return fromV2

  const version1 = executionResult.Version1 as Record<string, unknown> | undefined
  const fromV1 = asErrorText(version1?.error_message)
  if (fromV1) return fromV1

  return asErrorText(executionResult.error_message) ?? asErrorText(executionResult.errorMessage)
}

export function parseTransactionPollResult(result: Record<string, unknown>): TransactionPollResult {
  const executionInfo =
    (result.execution_info as Record<string, unknown> | undefined) ??
    (result.executionInfo as Record<string, unknown> | undefined)

  if (!executionInfo) {
    return { status: 'pending' }
  }

  const executionResult =
    (executionInfo.execution_result as Record<string, unknown> | undefined) ??
    (executionInfo.executionResult as Record<string, unknown> | undefined)

  if (!executionResult) {
    return { status: 'pending' }
  }

  const errorMessage = readErrorMessage(executionResult)
  if (errorMessage) {
    return { status: 'failed', detail: errorMessage }
  }

  return { status: 'finalized' }
}

export async function getTransactionPollResult(hash: string): Promise<TransactionPollResult> {
  try {
    const result = await infoGetTransaction(hash)
    if (!result) return { status: 'pending' }
    return parseTransactionPollResult(result)
  } catch {
    return { status: 'pending' }
  }
}

/** Fallback using casper-js-sdk client when raw RPC parsing is unavailable. */
export async function getTransactionPollResultViaSdk(hash: string): Promise<TransactionPollResult> {
  try {
    const rpc = createCasperRpcClient()
    const info = await (
      rpc as unknown as {
        getTransactionByTransactionHash: (h: string) => Promise<Record<string, unknown>>
      }
    ).getTransactionByTransactionHash(normalizeHash(hash))
    return parseTransactionPollResult(info)
  } catch {
    return getTransactionPollResult(hash)
  }
}
