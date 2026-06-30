import { z } from 'zod'

export const PUBLIC_KEY_REGEX = /^0[23][0-9a-fA-F]{64,66}$/

export const publicKeySchema = z
  .string()
  .regex(PUBLIC_KEY_REGEX, 'Invalid Casper SECP256K1 public key')

export const accountHashSchema = z
  .string()
  .refine((v) => /^account-hash-[0-9a-f]{64}$/i.test(v) || /^[0-9a-f]{64}$/i.test(v), {
    message: 'Invalid account hash',
  })

export const apiEnvelopeSchema = <T extends z.ZodType>(item: T) => z.object({ data: item })

export const tokenRowSchema = z.object({
  id: z.string(),
  package_hash: z.string(),
  contract_name: z.string(),
  symbol: z.string().nullable(),
  total_supply: z.string(),
  total_staked: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
})

export const complianceStatusSchema = z.object({
  accountHash: z.string(),
  status: z.string(),
  compliant: z.boolean(),
  country: z.number().nullable().optional(),
  accredited: z.boolean().optional(),
  registeredAt: z.string().nullable().optional(),
  revokedAt: z.string().nullable().optional(),
  revokeReason: z.string().nullable().optional(),
})

export const mcpArgsSchema = z.record(z.unknown())

export function validatePublicKey(key: string): string {
  return publicKeySchema.parse(key)
}

export function validateAccountHash(hash: string): string {
  const normalized = hash.startsWith('account-hash-') ? hash : `account-hash-${hash}`
  return accountHashSchema.parse(normalized)
}
