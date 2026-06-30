import { createHash, randomBytes } from 'node:crypto'
import { z } from 'zod'

export const transferAuthorizationSchema = z.object({
  from: z.string().min(10),
  to: z.string().min(10),
  value: z.string().regex(/^\d+$/),
  validAfter: z.number().int().nonnegative(),
  validBefore: z.number().int().positive(),
  nonce: z.string().min(8),
})

export type TransferAuthorization = z.infer<typeof transferAuthorizationSchema>

export const paymentPayloadSchema = z.object({
  authorization: transferAuthorizationSchema,
  signature: z.string().min(32),
  message: z.string().optional(),
  publicKey: z.string().regex(/^0[123][0-9a-fA-F]{64,66}$/),
  signedTransaction: z.unknown().optional(),
})

export type PaymentPayload = z.infer<typeof paymentPayloadSchema>

export const verifyRequestSchema = z.object({
  payment: paymentPayloadSchema,
  network: z.string(),
})

export const settleRequestSchema = verifyRequestSchema

export interface PaymentRequired {
  x402Version: number
  accepts: Array<{
    scheme: string
    network: string
    maxAmountRequired: string
    resource: string
    payTo: string
    asset: string
  }>
}

export function buildPaymentRequired(input: {
  resource: string
  payTo: string
  amountMotes: string
  network: string
}): PaymentRequired {
  return {
    x402Version: 1,
    accepts: [
      {
        scheme: 'exact',
        network: input.network,
        maxAmountRequired: input.amountMotes,
        resource: input.resource,
        payTo: input.payTo,
        asset: 'CSPR',
      },
    ],
  }
}

export function hashAuthorization(auth: TransferAuthorization, domain: string): string {
  const canonical = JSON.stringify({ domain, ...auth })
  return createHash('sha256').update(canonical).digest('hex')
}

export function generateNonce(): string {
  return createHash('sha256').update(randomBytes(16)).digest('hex').slice(0, 32)
}

export function isWithinTimeWindow(auth: TransferAuthorization, nowSec: number): boolean {
  return nowSec >= auth.validAfter && nowSec <= auth.validBefore
}
