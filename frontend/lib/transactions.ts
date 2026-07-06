'use client'

import { z } from 'zod'
import type { UnsignedTransaction } from './types'

const unsignedTransactionSchema = z.object({
  network: z.string().min(1),
  chainName: z.string().min(1),
  transactionType: z.string().min(1),
  transaction: z.record(z.unknown()),
  note: z.string().optional(),
})

export type TxPollStatus = 'pending' | 'processed' | 'finalized' | 'failed' | 'unknown'

export interface TxPollResult {
  status: TxPollStatus
  detail?: string
}

function unwrapMcpTransaction(value: unknown): unknown {
  if (!value || typeof value !== 'object') return value
  const record = value as Record<string, unknown>

  if ('transaction' in record) return value
  if ('result' in record) return unwrapMcpTransaction(record.result)
  if ('data' in record) return unwrapMcpTransaction(record.data)

  return value
}

export function parseUnsignedTransaction(
  value: unknown,
  source = 'MCP response',
): UnsignedTransaction {
  const parsed = unsignedTransactionSchema.safeParse(unwrapMcpTransaction(value))
  if (!parsed.success) {
    throw new Error(
      `${source} did not return a valid unsigned Casper transaction. ` +
        'Expected network, chainName, transactionType, transaction, and note.',
    )
  }

  const payload = JSON.stringify(parsed.data.transaction)
  if (!payload || payload === '{}') {
    throw new Error(`${source} returned an empty transaction payload.`)
  }

  return {
    ...parsed.data,
    note: parsed.data.note ?? '',
  }
}

export async function submitSignedTransaction(signedTransaction: unknown): Promise<string> {
  const res = await fetch('/api/transactions/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transaction: signedTransaction }),
  })
  const body = (await res.json().catch(() => null)) as {
    transactionHash?: string
    error?: { message?: string }
  } | null

  if (!res.ok || !body?.transactionHash) {
    throw new Error(body?.error?.message ?? 'Failed to submit transaction')
  }

  return body.transactionHash
}

export async function pollTransactionStatus(
  transactionHash: string,
  maxAttempts = 30,
  intervalMs = 4000,
): Promise<TxPollResult> {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      const res = await fetch(`/api/transactions/status/${encodeURIComponent(transactionHash)}`)
      const body = (await res.json()) as TxPollResult
      if (body.status === 'failed') return body
      if (body.status === 'processed' || body.status === 'finalized') {
        return { status: 'finalized', detail: body.detail }
      }
    } catch {
      // Transaction may not be indexed yet
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs))
  }

  return { status: 'pending', detail: 'Timed out waiting for finality' }
}
