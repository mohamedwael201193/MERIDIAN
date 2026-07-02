export type AgentRole = 'yield' | 'compliance' | 'audit'

export interface AgentLimits {
  rateLimitPerMinute: number
  maxAmountMotes: bigint
}

export interface AgentIdentityConfig {
  role: AgentRole
  pemEnv: string
  publicKeyEnv: string
  accountHashEnv: string
  permissions: readonly string[]
  limits: AgentLimits
}

export const AGENT_IDENTITY_CONFIG: Record<AgentRole, AgentIdentityConfig> = {
  yield: {
    role: 'yield',
    pemEnv: 'MERIDIAN_YIELD_AGENT_PRIVATE_KEY_PEM',
    publicKeyEnv: 'MERIDIAN_YIELD_AGENT_PUBLIC_KEY',
    accountHashEnv: 'MERIDIAN_YIELD_AGENT_ACCOUNT_HASH',
    permissions: ['read_yield', 'propose_decision', 'sign_attestation'],
    limits: { rateLimitPerMinute: 60, maxAmountMotes: 10_000_000_000_000n },
  },
  compliance: {
    role: 'compliance',
    pemEnv: 'MERIDIAN_COMPLIANCE_AGENT_PRIVATE_KEY_PEM',
    publicKeyEnv: 'MERIDIAN_COMPLIANCE_AGENT_PUBLIC_KEY',
    accountHashEnv: 'MERIDIAN_COMPLIANCE_AGENT_ACCOUNT_HASH',
    permissions: ['read_compliance', 'screen_account', 'sign_attestation'],
    limits: { rateLimitPerMinute: 120, maxAmountMotes: 0n },
  },
  audit: {
    role: 'audit',
    pemEnv: 'MERIDIAN_AUDIT_AGENT_PRIVATE_KEY_PEM',
    publicKeyEnv: 'MERIDIAN_AUDIT_AGENT_PUBLIC_KEY',
    accountHashEnv: 'MERIDIAN_AUDIT_AGENT_ACCOUNT_HASH',
    permissions: ['read_audit', 'review_decisions', 'sign_attestation'],
    limits: { rateLimitPerMinute: 60, maxAmountMotes: 0n },
  },
}

export const DEPLOYER_PEM_ENV = 'MERIDIAN_DEPLOYER_PRIVATE_KEY_PEM'

export function getAgentIdentityConfig(role: AgentRole): AgentIdentityConfig {
  return AGENT_IDENTITY_CONFIG[role]
}

export function assertAgentEnvSeparateFromDeployer(
  role: AgentRole,
  env: Record<string, string | undefined>,
): void {
  const config = getAgentIdentityConfig(role)
  const agentPem = env[config.pemEnv]?.trim()
  const deployerPem = env[DEPLOYER_PEM_ENV]?.trim()
  if (!agentPem || !deployerPem) return
  if (agentPem === deployerPem) {
    throw new Error(`${role}_agent_must_not_share_deployer_key`)
  }
  const agentPub = env[config.publicKeyEnv]?.trim()
  const deployerPub = env.MERIDIAN_DEPLOYER_PUBLIC_KEY?.trim()
  if (agentPub && deployerPub && agentPub === deployerPub) {
    throw new Error(`${role}_agent_must_not_share_deployer_public_key`)
  }
}
