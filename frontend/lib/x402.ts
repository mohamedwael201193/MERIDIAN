'use client'

import { AccountHash, NativeTransferBuilder, PublicKey } from 'casper-js-sdk'
import { MERIDIAN_NETWORK } from './contracts'
import type { WalletSigner } from './wallet/walletSigner'

export interface TransferAuthorization {
  from: string
  to: string
  value: string
  validAfter: number
  validBefore: number
  nonce: string
}

export interface PaymentAccept {
  scheme: string
  network: string
  maxAmountRequired: string
  resource: string
  payTo: string
  asset: string
}

export interface PaymentPayload {
  authorization: TransferAuthorization
  signature: string
  message?: string
  authorizationMessage?: string
  publicKey: string
  signedTransaction?: unknown
}

export async function hashAuthorization(
  auth: TransferAuthorization,
  domain: string,
): Promise<string> {
  const data = new TextEncoder().encode(canonicalAuthorization(auth, domain))
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

export function canonicalAuthorization(auth: TransferAuthorization, domain: string): string {
  return JSON.stringify({ domain, ...auth })
}

function generateNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

export async function buildX402Payment(
  signer: WalletSigner,
  accept: PaymentAccept,
  chainName = MERIDIAN_NETWORK,
): Promise<PaymentPayload> {
  const publicKey = await signer.getActivePublicKey()
  if (!publicKey) {
    throw new Error('Connect wallet before signing x402 payment')
  }

  const payerKey = PublicKey.fromHex(publicKey)
  const fromAccountHash = payerKey.accountHash().toPrefixedString()
  const payTo = accept.payTo.startsWith('account-hash-')
    ? accept.payTo
    : `account-hash-${accept.payTo}`
  const now = Math.floor(Date.now() / 1000)

  const authorization: TransferAuthorization = {
    from: fromAccountHash,
    to: payTo,
    value: accept.maxAmountRequired,
    validAfter: now,
    validBefore: now + 300,
    nonce: generateNonce(),
  }

  const domain = `${chainName}:x402`
  const authorizationMessage = canonicalAuthorization(authorization, domain)
  const digestHex = await hashAuthorization(authorization, domain)
  const authSign = await signer.signMessage(digestHex, publicKey)
  if (!authSign || authSign.cancelled || !authSign.signatureHex) {
    throw new Error(authSign?.error ?? 'Authorization signature rejected')
  }

  const recipient = AccountHash.fromString(payTo)
  const transaction = new NativeTransferBuilder()
    .from(payerKey)
    .targetAccountHash(recipient)
    .amount(accept.maxAmountRequired)
    .id(Date.now())
    .chainName(chainName)
    .payment(2_500_000_000)
    .build()

  const txSign = await signer.sign(transaction.toJSON() as object, publicKey)
  if (!txSign || txSign.cancelled || !txSign.transaction) {
    throw new Error(txSign?.error ?? 'Transfer transaction signing rejected')
  }

  return {
    authorization,
    signature: authSign.signatureHex.replace(/^0x/, ''),
    message: digestHex,
    authorizationMessage,
    publicKey,
    signedTransaction: txSign.transaction,
  }
}
