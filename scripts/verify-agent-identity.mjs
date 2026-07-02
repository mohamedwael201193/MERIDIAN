#!/usr/bin/env node
/**
 * Verify agent identity separation — never prints secret values.
 */
import { readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  loadPrivateKeyFromPem,
  verifyAccountHashMatches,
  verifyPublicKeyMatches,
  verifyDigestSignature,
  signDigest,
} from '../packages/meridian-casper-sdk/dist/wallet.js'
import {
  resolveInlinePemFromEnv,
  assertAgentEnvSeparateFromDeployer,
  getAgentIdentityConfig,
} from '../packages/meridian-env/dist/index.js'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const env = {}

if (existsSync(join(ROOT, '.env'))) {
  for (const line of readFileSync(join(ROOT, '.env'), 'utf8').split('\n')) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/)
    if (m) env[m[1]] = m[2]
  }
}

const roles = ['yield', 'compliance', 'audit']
let pass = 0
let fail = 0

function ok(label) {
  console.log(`PASS | ${label}`)
  pass++
}

function bad(label, err) {
  console.error(`FAIL | ${label} | ${err instanceof Error ? err.message : err}`)
  fail++
}

for (const role of roles) {
  try {
    assertAgentEnvSeparateFromDeployer(role, env)
    ok(`${role} agent key separate from deployer`)
  } catch (e) {
    bad(`${role} agent key separation`, e)
    continue
  }

  const config = getAgentIdentityConfig(role)
  try {
    const pem = resolveInlinePemFromEnv(env[config.pemEnv], role)
    const pub = env[config.publicKeyEnv]
    const hash = env[config.accountHashEnv]
    const key = loadPrivateKeyFromPem(pem)
    verifyPublicKeyMatches(key, pub)
    verifyAccountHashMatches(key, hash)
    ok(`${role} agent wallet identity verified`)

    const digest = Buffer.from(`${role}-attestation-test`, 'utf8')
    const sig = signDigest(key, digest)
    if (!verifyDigestSignature(pub, digest, sig)) {
      throw new Error('signature_verification_failed')
    }
    ok(`${role} agent signature generation`)
  } catch (e) {
    bad(`${role} agent identity`, e)
  }
}

try {
  const deployerPem = resolveInlinePemFromEnv(env.MERIDIAN_DEPLOYER_PRIVATE_KEY_PEM, 'deployer')
  const deployerKey = loadPrivateKeyFromPem(deployerPem)
  verifyPublicKeyMatches(deployerKey, env.MERIDIAN_DEPLOYER_PUBLIC_KEY)
  verifyAccountHashMatches(deployerKey, env.MERIDIAN_DEPLOYER_ACCOUNT_HASH)
  ok('deployer wallet identity verified')
} catch (e) {
  bad('deployer wallet', e)
}

console.log(JSON.stringify({ pass, fail }))
process.exit(fail > 0 ? 1 : 0)
