import 'server-only'
import { createHash } from 'node:crypto'
import { PublicKey } from 'casper-js-sdk'
import { verifyDigestSignature } from '@meridian/casper-sdk'

export type TransferAuthorization = {
  from: string
  to: string
  value: string
  validAfter: number
  validBefore: number
  nonce: string
}

export function hashAuthorization(auth: TransferAuthorization, domain: string): string {
  const canonical = JSON.stringify({ domain, ...auth })
  return createHash('sha256').update(canonical).digest('hex')
}

export function canonicalAuthorization(auth: TransferAuthorization, domain: string): string {
  return JSON.stringify({ domain, ...auth })
}

/** Casper Wallet prepends this header before signing (make-software/casper-wallet sign-message.tsx). */
export const CASPER_MESSAGE_HEADER = 'Casper Message:\n'

export function casperWalletMessageBytes(message: string): Buffer {
  return Buffer.from(`${CASPER_MESSAGE_HEADER}${message}`, 'utf8')
}

function normalizeAccountHash(value: string): string {
  return value.startsWith('account-hash-') ? value : `account-hash-${value}`
}

function signatureCandidates(signatureHex: string): string[] {
  const hex = signatureHex.replace(/^0x/, '')
  const variants = [hex]
  if (hex.length === 128) variants.push(`01${hex}`, `02${hex}`, `03${hex}`)
  if (hex.length === 130) variants.push(hex.slice(2))
  return [...new Set(variants)]
}

function messageCandidates(
  auth: TransferAuthorization,
  domain: string,
  signedMessage?: string,
): Buffer[] {
  const digestHex = hashAuthorization(auth, domain)
  const canonical = canonicalAuthorization(auth, domain)
  const raw = [signedMessage, digestHex, canonical].filter((value): value is string =>
    Boolean(value),
  )
  const messages = new Set<string>(raw)

  const buffers: Buffer[] = [Buffer.from(digestHex, 'hex')]
  for (const message of messages) {
    buffers.push(Buffer.from(message, 'utf8'))
    if (/^[0-9a-f]{64}$/i.test(message)) {
      buffers.push(Buffer.from(message, 'hex'))
      buffers.push(casperWalletMessageBytes(message))
    }
  }
  return buffers
}

export function verifyAuthorizationSignature(input: {
  authorization: TransferAuthorization
  signature: string
  publicKey: string
  domain: string
  message?: string
}): boolean {
  const accountHash = PublicKey.fromHex(input.publicKey).accountHash().toPrefixedString()
  if (normalizeAccountHash(input.authorization.from) !== accountHash) {
    return false
  }

  const messages = messageCandidates(input.authorization, input.domain, input.message)
  const signatures = signatureCandidates(input.signature)

  return messages.some((message) =>
    signatures.some((signatureHex) => {
      try {
        if (verifyDigestSignature(input.publicKey, message, signatureHex)) return true
      } catch {
        /* try next variant */
      }
      try {
        return PublicKey.fromHex(input.publicKey).verifySignature(
          message,
          Buffer.from(signatureHex, 'hex'),
        )
      } catch {
        return false
      }
    }),
  )
}
