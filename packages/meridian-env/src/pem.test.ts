import { describe, expect, it } from 'vitest'
import { resolveInlinePemFromEnv, isInlinePem } from './pem.js'
import { assertAgentEnvSeparateFromDeployer } from './agent-identity.js'

describe('resolveInlinePemFromEnv', () => {
  it('accepts inline PEM with escaped newlines', () => {
    const pem = resolveInlinePemFromEnv(
      '-----BEGIN PRIVATE KEY-----\\nabc\\n-----END PRIVATE KEY-----',
      'test',
    )
    expect(pem).toContain('\nabc\n')
  })

  it('rejects file paths', () => {
    expect(() => resolveInlinePemFromEnv('/home/user/keys/secret.pem', 'test')).toThrow(
      'test_pem_must_be_inline_in_env',
    )
  })

  it('rejects empty values', () => {
    expect(() => resolveInlinePemFromEnv('', 'test')).toThrow('test_pem_not_configured')
  })
})

describe('isInlinePem', () => {
  it('detects inline PEM', () => {
    expect(isInlinePem('-----BEGIN PRIVATE KEY-----')).toBe(true)
    expect(isInlinePem('/path/to/key.pem')).toBe(false)
  })
})

describe('assertAgentEnvSeparateFromDeployer', () => {
  it('rejects shared PEM between agent and deployer', () => {
    expect(() => {
      assertAgentEnvSeparateFromDeployer('yield', {
        MERIDIAN_YIELD_AGENT_PRIVATE_KEY_PEM: 'same-pem',
        MERIDIAN_DEPLOYER_PRIVATE_KEY_PEM: 'same-pem',
      })
    }).toThrow('yield_agent_must_not_share_deployer_key')
  })
})
