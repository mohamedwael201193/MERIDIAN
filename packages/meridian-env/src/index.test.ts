import { describe, expect, it } from 'vitest'
import {
  DEFAULT_OPENAI_MODEL,
  buildAiProviderChain,
  parsePhase1Env,
  resolveOpenAiBaseUrl,
  resolveOpenAiKey,
  resolveOpenAiModel,
  validateOpenAiKeyPresent,
} from './index.js'

describe('phase1EnvSchema', () => {
  it('accepts valid phase 1 cloud configuration', () => {
    const env = parsePhase1Env({
      CASPER_NETWORK: 'casper-test',
      CASPER_RPC_URL: 'https://node.cspr.cloud/rpc',
      CASPER_CHAIN_NAME: 'casper-test',
      CASPER_API_KEY: 'test-key',
      CASPER_SIDE_CAR_URL: 'https://api.cspr.cloud',
      DATABASE_URL: 'postgresql://user:pass@host:5432/postgres',
      SUPABASE_URL: 'https://project.supabase.co',
      SUPABASE_ANON_KEY: 'anon',
      SUPABASE_SERVICE_ROLE_KEY: 'service',
      UPSTASH_REDIS_REST_URL: 'https://example.upstash.io',
      UPSTASH_REDIS_REST_TOKEN: 'token',
    })
    expect(env.CASPER_NETWORK).toBe('casper-test')
  })

  it('resolves OpenAI key from uppercase or lowercase alias', () => {
    expect(resolveOpenAiKey({ OPENAI_API_KEY: 'sk-upper' })).toBe('sk-upper')
    expect(resolveOpenAiKey({ openai_api_key: 'sk-lower' })).toBe('sk-lower')
    expect(validateOpenAiKeyPresent({ openai_api_key: 'sk-lower' })).toBe(true)
    expect(validateOpenAiKeyPresent({})).toBe(false)
  })

  it('defaults OpenAI base URL to ZenMux', () => {
    expect(resolveOpenAiBaseUrl({})).toBe('https://zenmux.ai/api/v1')
    expect(resolveOpenAiBaseUrl({ OPENAI_BASE_URL: 'https://zenmux.ai/api/v1/' })).toBe(
      'https://zenmux.ai/api/v1',
    )
  })

  it('defaults OpenAI model to Z.AI GLM 5.2 free tier slug', () => {
    expect(DEFAULT_OPENAI_MODEL).toBe('z-ai/glm-5.2-free')
    expect(resolveOpenAiModel({})).toBe('z-ai/glm-5.2-free')
    expect(resolveOpenAiModel({ OPENAI_MODEL: 'custom/model' })).toBe('custom/model')
  })

  it('builds AI provider fallback chain in priority order', () => {
    const chain = buildAiProviderChain({
      OPENAI_API_KEY: 'sk-test',
      GROQ_API_KEY: 'gsk-test',
    })
    expect(chain.map((p) => p.id)).toEqual(['zenmux', 'groq'])
  })
})
