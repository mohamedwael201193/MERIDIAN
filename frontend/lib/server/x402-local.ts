import 'server-only'
import { Transaction } from 'casper-js-sdk'
import { backendFetch } from './backend'
import { createCasperRpcClient, formatTransactionHash } from './casper-rpc'
import {
  hashAuthorization,
  verifyAuthorizationSignature,
  type TransferAuthorization,
} from './x402-auth'

export type { TransferAuthorization }

export type PaymentPayload = {
  authorization: TransferAuthorization
  signature: string
  message?: string
  publicKey: string
  signedTransaction?: unknown
}

const DEFAULT_PAY_TO =
  'account-hash-267bc977600c9512c0ce5e96af4d0057d514998cc752e28b8f5e91b654a72c27'

export function getX402Amount(): string {
  return process.env.X402_PAYMENT_AMOUNT_MOTES ?? '2500000000'
}

export function getX402PayTo(): string {
  return process.env.X402_PAY_TO_ACCOUNT_HASH ?? DEFAULT_PAY_TO
}

export function getX402Network(): string {
  return process.env.CASPER_CHAIN_NAME ?? process.env.NEXT_PUBLIC_CASPER_NETWORK ?? 'casper-test'
}

export { hashAuthorization }

function normalizeAccountHash(value: string): string {
  return value.startsWith('account-hash-') ? value : `account-hash-${value}`
}

export function verifyX402Payment(payment: PaymentPayload, network = getX402Network()) {
  const now = Math.floor(Date.now() / 1000)
  const auth = payment.authorization
  const payTo = normalizeAccountHash(getX402PayTo())
  const domain = `${network}:x402`

  if (now < auth.validAfter || now > auth.validBefore) {
    return { valid: false, reason: 'authorization_expired' }
  }

  if (normalizeAccountHash(auth.to) !== payTo) {
    return { valid: false, reason: 'invalid_pay_to' }
  }

  if (BigInt(auth.value) !== BigInt(getX402Amount())) {
    return { valid: false, reason: 'invalid_amount' }
  }

  try {
    const verified = verifyAuthorizationSignature({
      authorization: auth,
      signature: payment.signature,
      publicKey: payment.publicKey,
      domain,
      message: payment.message,
    })

    return verified ? { valid: true } : { valid: false, reason: 'invalid_signature' }
  } catch {
    return { valid: false, reason: 'signature_parse_error' }
  }
}

export async function settleX402Payment(payment: PaymentPayload) {
  const verification = verifyX402Payment(payment)
  if (!verification.valid) return { success: false, reason: verification.reason }
  if (!payment.signedTransaction) return { success: false, reason: 'signed_transaction_required' }

  try {
    const transaction = Transaction.fromJSON(payment.signedTransaction)
    const rpc = createCasperRpcClient()
    const result = await rpc.putTransaction(transaction)
    return { success: true, transactionHash: formatTransactionHash(result.transactionHash) }
  } catch (error) {
    return {
      success: false,
      reason: error instanceof Error ? error.message : 'settle_failed',
    }
  }
}

export async function getPaidResourceData(resource: string) {
  if (resource === 'yield-rate') {
    const tokenPkg =
      process.env.MERIDIAN_TOKEN_PACKAGE ??
      process.env.NEXT_PUBLIC_MERIDIAN_CONTRACT_PACKAGE_HASH ??
      'contract-package-9bcac97d0e6723049fc130daa22f69e88a5d077a1df6b4e38536f0703bcaa2ca'
    return backendFetch(`/api/v1/tokens/${encodeURIComponent(tokenPkg)}/yield`, {
      revalidate: 0,
    })
  }

  throw new Error('Unknown x402 resource')
}
