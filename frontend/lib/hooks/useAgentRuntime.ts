'use client'

import { useCallback, useState } from 'react'
import { meridianApi } from '@lib/api'
import { useWalletActions } from '@lib/hooks/useWalletActions'
import { parseUnsignedTransaction } from '@lib/transactions'
import { explorerTxUrl } from '@lib/contracts'
import { recordMissionComplete } from '@lib/agent-profile'
import { accountHashFromPublicKey } from '@lib/wallet/accountHash'
import type { UnsignedTransaction } from '@lib/types'

export type RuntimePhase =
  | 'idle'
  | 'thinking'
  | 'selecting'
  | 'calling'
  | 'analyzing'
  | 'wallet'
  | 'waiting'
  | 'broadcast'
  | 'finalized'
  | 'complete'
  | 'error'

export interface PlannerStep {
  tool: string
  kind: 'read' | 'write'
  rationale: string
  result?: unknown
  unsignedTransaction?: unknown
  walletRequired: boolean
}

export interface PlannerResult {
  sessionId: string
  reasoning: string
  steps: PlannerStep[]
}

async function emitTrace(
  sessionId: string,
  stepType: string,
  message: string,
  payload?: Record<string, unknown>,
): Promise<void> {
  await meridianApi.traceEmit({
    sessionId,
    stepType,
    message,
    agentName: 'meridian-runtime',
    payload,
  })
}

export function useAgentRuntime() {
  const wallet = useWalletActions()
  const [phase, setPhase] = useState<RuntimePhase>('idle')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [reasoning, setReasoning] = useState<string | null>(null)
  const [steps, setSteps] = useState<PlannerStep[]>([])
  const [unsignedTx, setUnsignedTx] = useState<UnsignedTransaction | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [lastObjective, setLastObjective] = useState<string | null>(null)

  const reset = useCallback(() => {
    setPhase('idle')
    setSessionId(null)
    setReasoning(null)
    setSteps([])
    setUnsignedTx(null)
    setTxHash(null)
    setError(null)
    setLastObjective(null)
  }, [])

  const execute = useCallback(
    async (
      objective: string,
      existingSessionId?: string,
    ): Promise<{ ok: true; result: PlannerResult } | { ok: false; error: string }> => {
      setError(null)
      setLoading(true)
      setLastObjective(objective)
      setUnsignedTx(null)
      setTxHash(null)
      setPhase('thinking')

      try {
        const publicKey = await wallet.getPublicKey()
        const callerAccountHash = publicKey ? accountHashFromPublicKey(publicKey) : undefined
        const { data } = await meridianApi.plannerExecute({
          objective,
          callerPublicKey: publicKey ?? undefined,
          callerAccountHash,
          sessionId: existingSessionId,
        })

        const result = data as PlannerResult
        setSessionId(result.sessionId)
        setReasoning(result.reasoning)
        setSteps(result.steps)

        const writeStep = result.steps.find((s) => s.walletRequired && s.unsignedTransaction)
        if (writeStep?.unsignedTransaction) {
          setPhase('wallet')
          setUnsignedTx(parseUnsignedTransaction(writeStep.unsignedTransaction, writeStep.tool))
        } else {
          setPhase('complete')
          recordMissionComplete(objective, result.sessionId, publicKey)
        }
        return { ok: true, result }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Runtime execution failed'
        setError(message)
        setPhase('error')
        return { ok: false, error: message }
      } finally {
        setLoading(false)
      }
    },
    [wallet],
  )

  const signAndContinue = useCallback(async () => {
    if (!unsignedTx || !sessionId) return
    setLoading(true)
    setPhase('waiting')
    setError(null)

    try {
      const hash = await wallet.signAndSubmit(unsignedTx)
      setTxHash(hash)
      setUnsignedTx(null)
      setPhase('broadcast')

      await emitTrace(sessionId, 'wallet_signed', 'User approved transaction in Casper Wallet', {
        tool: unsignedTx.note,
      })
      await emitTrace(sessionId, 'deploy_broadcast', `Transaction submitted: ${hash}`, {
        transactionHash: hash,
        explorerUrl: explorerTxUrl(hash),
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Wallet signing failed'
      setError(message)
      setPhase('error')
      if (sessionId) {
        await emitTrace(sessionId, 'error', message).catch(() => undefined)
      }
    } finally {
      setLoading(false)
    }
  }, [unsignedTx, sessionId, wallet])

  const onTxFinalized = useCallback(async () => {
    if (!sessionId || !txHash) return
    setPhase('finalized')

    await emitTrace(sessionId, 'finality', `Transaction finalized on Casper testnet`, {
      transactionHash: txHash,
      explorerUrl: explorerTxUrl(txHash),
    })
    await emitTrace(
      sessionId,
      'indexer_updated',
      'Indexer will reflect on-chain state on next poll',
    )
    await emitTrace(sessionId, 'complete', 'Mission completed after wallet approval')

    if (lastObjective) {
      const publicKey = await wallet.getPublicKey()
      recordMissionComplete(lastObjective, sessionId, publicKey)
    }
    setPhase('complete')
  }, [sessionId, txHash, lastObjective, wallet])

  return {
    phase,
    sessionId,
    reasoning,
    steps,
    unsignedTx,
    txHash,
    error,
    loading,
    lastObjective,
    execute,
    signAndContinue,
    onTxFinalized,
    reset,
  }
}
