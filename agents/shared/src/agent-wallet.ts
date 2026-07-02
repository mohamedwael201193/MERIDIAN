import { createHash } from 'node:crypto'
import {
  loadPrivateKeyFromPem,
  signDigest,
  verifyAccountHashMatches,
  verifyPublicKeyMatches,
} from '@meridian/casper-sdk'
import {
  assertAgentEnvSeparateFromDeployer,
  getAgentIdentityConfig,
  resolveInlinePemFromEnv,
  type AgentIdentityConfig,
  type AgentRole,
} from '@meridian/env'

export interface AgentWallet {
  role: AgentRole
  publicKey: string
  accountHash: string
  permissions: readonly string[]
  limits: AgentIdentityConfig['limits']
  signAttestation(payload: unknown): AgentAttestation
}

export interface AgentAttestation {
  agent: AgentRole
  publicKey: string
  accountHash: string
  digest: string
  signature: string
}

function attestationDigest(role: AgentRole, payload: unknown): Buffer {
  const canonical = JSON.stringify({ agent: role, payload, v: 1 })
  return createHash('sha256').update(canonical).digest()
}

export function loadAgentWallet(
  role: AgentRole,
  env: Record<string, string | undefined> = process.env,
): AgentWallet {
  assertAgentEnvSeparateFromDeployer(role, env)
  const config = getAgentIdentityConfig(role)
  const pem = resolveInlinePemFromEnv(env[config.pemEnv], role)
  const publicKey = env[config.publicKeyEnv]?.trim()
  const accountHash = env[config.accountHashEnv]?.trim()
  if (!publicKey) throw new Error(`${role}_agent_public_key_missing`)
  if (!accountHash) throw new Error(`${role}_agent_account_hash_missing`)

  const privateKey = loadPrivateKeyFromPem(pem)
  verifyPublicKeyMatches(privateKey, publicKey)
  verifyAccountHashMatches(privateKey, accountHash)

  return {
    role,
    publicKey,
    accountHash,
    permissions: config.permissions,
    limits: config.limits,
    signAttestation(payload: unknown): AgentAttestation {
      const digestBuf = attestationDigest(role, payload)
      return {
        agent: role,
        publicKey,
        accountHash,
        digest: digestBuf.toString('hex'),
        signature: signDigest(privateKey, digestBuf),
      }
    },
  }
}

export function enforceAmountLimit(
  role: AgentRole,
  amountMotes: string | bigint,
  _env: Record<string, string | undefined> = process.env,
): void {
  const config = getAgentIdentityConfig(role)
  const amount = typeof amountMotes === 'bigint' ? amountMotes : BigInt(amountMotes)
  if (amount > config.limits.maxAmountMotes) {
    throw new Error(`${role}_agent_amount_exceeds_limit`)
  }
}
