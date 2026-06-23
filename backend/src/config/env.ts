import { z } from 'zod'
import { parseMeridianEnv } from '@meridian/env'

const nonEmpty = z.string().trim().min(1)

export const backendEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  HOST: z.string().default('0.0.0.0'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  MERIDIAN_API_KEY: nonEmpty,
  MERIDIAN_CONTRACTS_PATH: z.string().default('../deployed/addresses.json'),
  CSPR_STREAMING_URL: z
    .string()
    .url()
    .default('wss://streaming.testnet.cspr.cloud'),
  INDEXER_ENABLED: z
    .string()
    .transform((v) => v !== 'false' && v !== '0')
    .default('true'),
  INDEXER_BACKFILL_ON_START: z
    .string()
    .transform((v) => v !== 'false' && v !== '0')
    .default('true'),
  INDEXER_START_BLOCK: z.coerce.number().int().nonnegative().default(0),
})

export type BackendEnv = z.infer<typeof backendEnvSchema> & ReturnType<typeof parseMeridianEnv>

export function loadBackendEnv(
  source: Record<string, string | undefined> = process.env,
): BackendEnv {
  const cloud = parseMeridianEnv(source)
  const backend = backendEnvSchema.parse(source)
  return { ...cloud, ...backend }
}
