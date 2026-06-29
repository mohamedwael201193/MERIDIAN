#!/usr/bin/env node
/**
 * Generate TypeScript contract types from Casper contract schema JSON (Odra cargo odra schema).
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const schemaDir = resolve(root, 'contracts/resources/casper_contract_schemas')
const outFile = resolve(root, 'packages/meridian-ts-types/src/index.ts')

const casperToTs = {
  U8: 'number',
  U16: 'number',
  U32: 'number',
  U64: 'bigint',
  U128: 'string',
  U256: 'string',
  U512: 'string',
  Bool: 'boolean',
  String: 'string',
  Key: 'string',
  PublicKey: 'string',
  Unit: 'void',
}

function mapTy(ty) {
  if (typeof ty === 'string') return casperToTs[ty] ?? 'unknown'
  if (ty?.Option) return `${mapTy(ty.Option)} | null`
  if (ty?.List) return `${mapTy(ty.List)}[]`
  if (ty?.Tuple) return ty.Tuple.map(mapTy).join(' | ')
  return 'unknown'
}

function structTypes(schema) {
  return (schema.types ?? [])
    .filter((t) => t.struct)
    .map((t) => {
      const s = t.struct
      const fields = (s.members ?? [])
        .map((m) => `  ${m.name}: ${mapTy(m.ty)};`)
        .join('\n')
      return `export interface ${s.name} {\n${fields}\n}`
    })
}

const files = readdirSync(schemaDir).filter((f) => f.endsWith('_schema.json'))
const contracts = []
const blocks = [
  '/** Auto-generated from Casper contract schemas — do not edit manually. */',
  "export type ContractHash = `hash-${string}`;",
  "export type PackageHash = `contract-package-${string}`;",
  '',
]

for (const file of files.sort()) {
  const schema = JSON.parse(readFileSync(resolve(schemaDir, file), 'utf8'))
  const name = schema.contract_name
  contracts.push(name)
  blocks.push(`// --- ${name} ---`)
  blocks.push(...structTypes(schema))
  blocks.push('')
  const eps = (schema.entry_points ?? [])
    .filter((ep) => ep?.name && !ep.name.startsWith('__'))
    .map((ep) => `  ${ep.name}: { args: unknown; ret: ${mapTy(ep.return_ty ?? 'Unit')} };`)
    .join('\n')
  blocks.push(`export interface ${name}EntryPoints {\n${eps}\n}`)
  blocks.push('')
}

blocks.push('export interface DeployedContracts {')
for (const name of contracts) {
  blocks.push(`  ${name}: { package_hash: PackageHash };`)
}
blocks.push('}')
blocks.push('')

writeFileSync(outFile, blocks.join('\n') + '\n')
console.log(`Wrote ${outFile} (${contracts.length} contracts)`)
