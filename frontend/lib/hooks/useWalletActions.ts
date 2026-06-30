'use client'

import { meridianApi } from '@lib/api'
import type { UnsignedTransaction } from '@lib/types'
import { parseUnsignedTransaction, submitSignedTransaction } from '@lib/transactions'
import { buildX402Payment, type PaymentAccept } from '@lib/x402'
import { validatePublicKey } from '@lib/schemas'
import { revalidateMeridianData } from '@lib/hooks/useMeridianData'
import { connectCasperWallet, disconnectCasperWallet } from '@lib/wallet/connectCasperWallet'
import { useClickReady } from './useClickReady'

function errorMessage(error: unknown): string | null {
  if (error && typeof error === 'object') {
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string') return message
  }
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return null
}

function isSiteApprovalError(error: unknown): boolean {
  const message = errorMessage(error)?.toLowerCase() ?? ''
  return message.includes('not approved') || message.includes('connect with the site')
}

function walletErrorMessage(error: unknown): string {
  if (error && typeof error === 'object') {
    const message = (error as { message?: unknown }).message
    const code = (error as { code?: unknown }).code
    if (message === 'Wallet is locked' || code === 1) {
      return 'Unlock Casper Wallet, then try again.'
    }
    if (isSiteApprovalError(error)) {
      return 'Approve this site in Casper Wallet, then try again.'
    }
    if (typeof message === 'string') return message
  }
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'Wallet request failed'
}

export function useWalletActions() {
  const { clickRef } = useClickReady()

  const getActivePublicKey = async (): Promise<string> => {
    if (!clickRef) throw new Error('Wallet not connected')
    try {
      const publicKey = await clickRef.getActivePublicKey?.()
      if (!publicKey) throw new Error('Connect wallet first')
      validatePublicKey(publicKey)
      return publicKey
    } catch (error) {
      if (isSiteApprovalError(error)) {
        await disconnectCasperWallet(clickRef)
        await connectCasperWallet(clickRef)
        const publicKey = await clickRef.getActivePublicKey?.()
        if (publicKey) {
          validatePublicKey(publicKey)
          return publicKey
        }
      }
      throw new Error(walletErrorMessage(error))
    }
  }

  const signAndSubmit = async (unsigned: UnsignedTransaction) => {
    if (!clickRef) throw new Error('Wallet not connected')
    const transaction = parseUnsignedTransaction(unsigned, 'Unsigned transaction')
    let publicKey = await getActivePublicKey()

    let signed
    try {
      signed = await clickRef.sign(transaction.transaction as never, publicKey)
    } catch (error) {
      if (!isSiteApprovalError(error)) throw error
      await disconnectCasperWallet(clickRef)
      await connectCasperWallet(clickRef)
      publicKey = await getActivePublicKey()
      signed = await clickRef.sign(transaction.transaction as never, publicKey)
    }
    if (!signed?.transaction) throw new Error(signed?.error ?? 'Wallet rejected signing')
    const hash = await submitSignedTransaction(signed.transaction)
    await revalidateMeridianData()
    return hash
  }

  return {
    connect: () => connectCasperWallet(clickRef),
    signIn: () => connectCasperWallet(clickRef),
    signOut: () => disconnectCasperWallet(clickRef),
    async getPublicKey() {
      if (!clickRef) return null
      try {
        return (
          (await clickRef.getActivePublicKey?.()) ?? clickRef.currentAccount?.public_key ?? null
        )
      } catch {
        return clickRef.currentAccount?.public_key ?? null
      }
    },
    getActivePublicKey,
    signAndSubmit,
    async callWriteTool(tool: string, args: Record<string, unknown>) {
      const publicKey = await getActivePublicKey()
      const { result } = await meridianApi.mcpTool(tool, { ...args, callerPublicKey: publicKey })
      return signAndSubmit(parseUnsignedTransaction(result, `${tool} response`))
    },
    async signX402Payment(accept: PaymentAccept) {
      if (!clickRef) throw new Error('Wallet not connected')
      try {
        return await buildX402Payment(clickRef, accept)
      } catch (error) {
        if (isSiteApprovalError(error)) {
          await disconnectCasperWallet(clickRef)
          await connectCasperWallet(clickRef)
          return buildX402Payment(clickRef, accept)
        }
        throw new Error(walletErrorMessage(error))
      }
    },
  }
}
