import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'

const moduleDir = dirname(fileURLToPath(import.meta.url))

const contractEntrySchema = z.object({
  contract_hash: z.string(),
  package_hash: z.string(),
  explorer_url: z.string().url(),
})

const addressesSchema = z.object({
  network: z.string(),
  chain_name: z.string(),
  deployed_at: z.string(),
  contracts: z.record(z.string(), contractEntrySchema),
  transaction_hashes: z.array(
    z.object({
      label: z.string(),
      hash: z.string(),
    }),
  ),
})

export type DeployedAddresses = z.infer<typeof addressesSchema>

export function stripHashPrefix(value: string): string {
  return value.replace(/^(hash-|contract-package-)/, '')
}

/** Resolve deployed/addresses.json across monorepo cwd and bundled dist copies. */
export function resolveContractsPath(configuredPath: string): string {
  const repoRootFromDist = resolve(moduleDir, '../../..')
  const candidates = [
    resolve(process.cwd(), configuredPath),
    resolve(repoRootFromDist, configuredPath),
    resolve(repoRootFromDist, 'deployed/addresses.json'),
    resolve(moduleDir, '../deployed/addresses.json'),
    resolve(process.cwd(), 'deployed/addresses.json'),
    resolve(process.cwd(), '../deployed/addresses.json'),
    resolve(process.cwd(), 'src/deployed/addresses.json'),
  ]

  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate
  }

  throw new Error(
    `Contract addresses file not found (configured=${configuredPath}). Tried: ${candidates.join(', ')}`,
  )
}

export function loadDeployedAddresses(path: string): DeployedAddresses {
  const absolute = resolveContractsPath(path)
  const raw = readFileSync(absolute, 'utf8')
  return addressesSchema.parse(JSON.parse(raw))
}

export function packageHashesForStreaming(contracts: DeployedAddresses['contracts']): string[] {
  return Object.values(contracts).map((c) => stripHashPrefix(c.package_hash))
}

export function contractNameByPackage(
  contracts: DeployedAddresses['contracts'],
): Map<string, string> {
  const map = new Map<string, string>()
  for (const [name, entry] of Object.entries(contracts)) {
    map.set(stripHashPrefix(entry.package_hash), name)
    map.set(entry.package_hash, name)
  }
  return map
}
