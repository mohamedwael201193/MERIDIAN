import { z } from 'zod'
import {
  buildAiProviderChain,
  DEFAULT_OPENAI_MODEL,
  resolveOpenAiBaseUrl,
  resolveOpenAiKey,
  resolveOpenAiModel,
} from './ai-providers.js'

export {
  buildAiProviderChain,
  DEFAULT_OPENAI_MODEL,
  resolveOpenAiBaseUrl,
  resolveOpenAiKey,
  resolveOpenAiModel,
}
export type { AiProviderConfig, AiProviderKind } from './ai-providers.js'
export { resolveInlinePemFromEnv, isInlinePem } from './pem.js'
export {
  AGENT_IDENTITY_CONFIG,
  DEPLOYER_PEM_ENV,
  assertAgentEnvSeparateFromDeployer,
  getAgentIdentityConfig,
} from './agent-identity.js'
export type { AgentRole, AgentLimits, AgentIdentityConfig } from './agent-identity.js'

const nonEmpty = z.string().trim().min(1)

/** Phase 1 required cloud + Casper + AI variables */
export const phase1EnvSchema = z.object({
  CASPER_NETWORK: nonEmpty,
  CASPER_RPC_URL: z.string().url(),
  CASPER_CHAIN_NAME: nonEmpty,
  CASPER_API_KEY: nonEmpty,
  CASPER_SIDE_CAR_URL: z.string().url(),
  DATABASE_URL: z.string().startsWith('postgresql://'),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: nonEmpty,
  SUPABASE_SERVICE_ROLE_KEY: nonEmpty,
  UPSTASH_REDIS_REST_URL: z.string().url(),
  UPSTASH_REDIS_REST_TOKEN: nonEmpty,
})

export type Phase1Env = z.infer<typeof phase1EnvSchema>

/** Full runtime schema (includes optional / deferred keys) */
export const meridianEnvSchema = phase1EnvSchema.extend({
  OPENAI_API_KEY: z.string().optional(),
  openai_api_key: z.string().optional(),
  OPENAI_BASE_URL: z.string().url().optional(),
  OPENAI_MODEL: z.string().optional(),
  AI_PROVIDER: z.string().optional(),
  CEREBRAS_API_KEY: z.string().optional(),
  CEREBRAS_MODEL: z.string().optional(),
  SAMBANOVA_API_KEY: z.string().optional(),
  SAMBANOVA_MODEL: z.string().optional(),
  TOGETHER_API_KEY: z.string().optional(),
  TOGETHER_MODEL: z.string().optional(),
  OPENROUTER_API_KEY: z.string().optional(),
  OPENROUTER_MODEL: z.string().optional(),
  GROQ_API_KEY: z.string().optional(),
  GROQ_MODEL: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  GOOGLE_API_KEY: z.string().optional(),
  REDIS_URL: z.string().optional(),
  MERIDIAN_DEPLOYER_PUBLIC_KEY: z.string().optional(),
  deployer_public_key: z.string().optional(),
  MERIDIAN_DEPLOYER_PRIVATE_KEY_PEM: z.string().optional(),
  MERIDIAN_DEPLOYER_ACCOUNT_HASH: z.string().optional(),
  MERIDIAN_YIELD_AGENT_PUBLIC_KEY: z.string().optional(),
  MERIDIAN_YIELD_AGENT_PRIVATE_KEY_PEM: z.string().optional(),
  MERIDIAN_YIELD_AGENT_ACCOUNT_HASH: z.string().optional(),
  MERIDIAN_COMPLIANCE_AGENT_PUBLIC_KEY: z.string().optional(),
  MERIDIAN_COMPLIANCE_AGENT_PRIVATE_KEY_PEM: z.string().optional(),
  MERIDIAN_COMPLIANCE_AGENT_ACCOUNT_HASH: z.string().optional(),
  MERIDIAN_AUDIT_AGENT_PUBLIC_KEY: z.string().optional(),
  MERIDIAN_AUDIT_AGENT_PRIVATE_KEY_PEM: z.string().optional(),
  MERIDIAN_AUDIT_AGENT_ACCOUNT_HASH: z.string().optional(),
  OFAC_SDN_FEED_URL: z.string().url().optional(),
  EU_CONSOLIDATED_LIST_URL: z.string().url().optional(),
  NEXT_PUBLIC_CASPER_NETWORK: z.string().optional(),
  NEXT_PUBLIC_MERIDIAN_CONTRACT_PACKAGE_HASH: z.string().optional(),
  NEXT_PUBLIC_MCP_SERVER_URL: z.string().optional(),
  X402_FACILITATOR_PORT: z.string().optional(),
  X402_PAYMENT_TOKEN_CONTRACT_HASH: z.string().optional(),
})

export type MeridianEnv = z.infer<typeof meridianEnvSchema>

export function parsePhase1Env(env: Record<string, string | undefined>): Phase1Env {
  return phase1EnvSchema.parse(env)
}

export function parseMeridianEnv(env: Record<string, string | undefined>): MeridianEnv {
  return meridianEnvSchema.parse(env)
}

export function validateOpenAiKeyPresent(env: Record<string, string | undefined>): boolean {
  const key = resolveOpenAiKey(env)
  return key !== undefined && key.length > 0
}
