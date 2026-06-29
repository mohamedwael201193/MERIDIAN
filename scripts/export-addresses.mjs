#!/usr/bin/env node
/**
 * Export deployed/casper-test-contracts.toml → deployed/addresses.json
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const tomlPath = resolve(root, 'deployed/casper-test-contracts.toml')
const jsonPath = resolve(root, 'deployed/addresses.json')

if (!existsSync(tomlPath)) {
  console.error(`Missing ${tomlPath}`)
  process.exit(1)
}

const raw = readFileSync(tomlPath, 'utf8')
const contracts = {}
const txHashes = [
  { label: 'deploy_ComplianceRegistry', hash: '930efed7e6e20e36b4f3a4d03bbe0a5952160f277c9c14387659da5a311b1bd8' },
  { label: 'deploy_MeridianToken', hash: 'ca4c4b96e6cf5638633b3123d5e54397b611256d656eea19938b5eb4493fcc74' },
  { label: 'wire_set_token_address', hash: '3eafa92ddf56f60fda58fb43df57661ef7e1e99c5c1de702eb83cd422d04c054' },
  { label: 'deploy_StakingVault', hash: 'e69eb51cfe1fad92c581f953284266abb9fced6fb29e3d40e55de487338b0326' },
  { label: 'deploy_YieldDistributor', hash: '2c3ca30dd90156bdd303837e16f152cfacf3fad531249f4e8030bab8deadc6e8' },
  { label: 'wire_set_yield_distributor', hash: 'fe73226a365ce149ae17dc24556410e4b9d6a627467317999f932169ad8efca0' },
  { label: 'wire_set_staking_vault', hash: 'b41a4b8b81ce5741339134b467450c5848da970c0f3ccf1ca6a659d844f1c347' },
  { label: 'wire_register_holder', hash: '7c6a47662daf123203526b4f83433b4c9a19e4c7be045fbf473615d035a7ad15' },
  { label: 'deploy_MeridianAudit', hash: '1611925b3bf87df18855cac35dc42b9ecab695176cc49a6c4de8c9375034f08f' },
]

for (const block of raw.split('[[contracts]]')) {
  if (!block.includes('package_hash')) continue
  const name = block.match(/name\s*=\s*"([^"]+)"/)?.[1]
  const packageHash = block.match(/package_hash\s*=\s*"([^"]+)"/)?.[1]
  if (!name || !packageHash) continue
  const hash = packageHash.replace(/^hash-/, '')
  contracts[name] = {
    contract_hash: packageHash.startsWith('hash-') ? packageHash : `hash-${packageHash}`,
    package_hash: packageHash.includes('contract-package-')
      ? packageHash
      : `contract-package-${hash}`,
    explorer_url: `https://testnet.cspr.live/contract/${packageHash.startsWith('hash-') ? packageHash : `hash-${packageHash}`}`,
  }
}

const out = {
  network: 'casper-test',
  chain_name: 'casper-test',
  deployed_at: new Date().toISOString(),
  contracts,
  transaction_hashes: txHashes,
}

writeFileSync(jsonPath, JSON.stringify(out, null, 2) + '\n')
console.log(`Wrote ${jsonPath} (${Object.keys(contracts).length} contracts)`)
