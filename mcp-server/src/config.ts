import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { z } from 'zod'
import { parseMeridianEnv } from '@meridian/env'

const envSchema = z.object({
  MERIDIAN_MCP_TRANSPORT: z.enum(['stdio', 'http']).default('stdio'),
  MERIDIAN_MCP_PORT: z.coerce.number().int().positive().default(3002),
  MERIDIAN_MCP_HOST: z.string().default('0.0.0.0'),
  MERIDIAN_MCP_API_KEY: z.string().optional(),
  MERIDIAN_CONTRACTS_PATH: z.string().default('deployed/addresses.json'),
  BACKEND_URL: z.string().url().default('http://127.0.0.1:3000'),
  MERIDIAN_API_KEY: z.string().min(1),
  X402_FACILITATOR_URL: z.string().url().default('http://127.0.0.1:3001'),
  X402_RESOURCE_URL: z.string().url().default('http://127.0.0.1:3003'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
})

export type McpConfig = z.infer<typeof envSchema> & ReturnType<typeof parseMeridianEnv>

export interface DeployedAddresses {
  network: string
  chain_name: string
  contracts: Record<
    string,
    { contract_hash: string; package_hash: string; explorer_url: string }
  >
}

export function loadConfig(source: Record<string, string | undefined> = process.env): McpConfig {
  const cloud = parseMeridianEnv(source)
  const portFromRender = source.PORT ? Number(source.PORT) : undefined
  const mcp = envSchema.parse({
    ...source,
    MERIDIAN_MCP_PORT: portFromRender ?? source.MERIDIAN_MCP_PORT,
  })
  return { ...cloud, ...mcp }
}

export function loadAddresses(path: string): DeployedAddresses {
  const absolute = resolve(process.cwd(), path)
  return JSON.parse(readFileSync(absolute, 'utf8')) as DeployedAddresses
}
