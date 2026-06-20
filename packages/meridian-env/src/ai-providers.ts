export type AiProviderKind = 'openai' | 'gemini'

export interface AiProviderConfig {
  id: string
  kind: AiProviderKind
  baseUrl?: string
  apiKey: string
  model: string
}

/** ZenMux primary — free tier slug when available on provider. */
export const DEFAULT_OPENAI_MODEL = 'z-ai/glm-5.2-free'

export function buildAiProviderChain(env: Record<string, string | undefined>): AiProviderConfig[] {
  const chain: AiProviderConfig[] = []

  const zenmuxKey = resolveOpenAiKey(env)
  if (zenmuxKey) {
    chain.push({
      id: 'zenmux',
      kind: 'openai',
      baseUrl: resolveOpenAiBaseUrl(env),
      apiKey: zenmuxKey,
      model: resolveOpenAiModel(env),
    })
  }

  if (env.CEREBRAS_API_KEY?.trim()) {
    chain.push({
      id: 'cerebras',
      kind: 'openai',
      baseUrl: 'https://api.cerebras.ai/v1',
      apiKey: env.CEREBRAS_API_KEY.trim(),
      model: env.CEREBRAS_MODEL?.trim() || 'zai-glm-4.7',
    })
  }

  if (env.SAMBANOVA_API_KEY?.trim()) {
    chain.push({
      id: 'sambanova',
      kind: 'openai',
      baseUrl: 'https://api.sambanova.ai/v1',
      apiKey: env.SAMBANOVA_API_KEY.trim(),
      model: env.SAMBANOVA_MODEL?.trim() || 'Meta-Llama-3.3-70B-Instruct',
    })
  }

  if (env.TOGETHER_API_KEY?.trim()) {
    chain.push({
      id: 'together',
      kind: 'openai',
      baseUrl: 'https://api.together.xyz/v1',
      apiKey: env.TOGETHER_API_KEY.trim(),
      model: env.TOGETHER_MODEL?.trim() || 'meta-llama/Llama-3.3-70B-Instruct-Turbo-Free',
    })
  }

  if (env.OPENROUTER_API_KEY?.trim()) {
    chain.push({
      id: 'openrouter',
      kind: 'openai',
      baseUrl: 'https://openrouter.ai/api/v1',
      apiKey: env.OPENROUTER_API_KEY.trim(),
      model: env.OPENROUTER_MODEL?.trim() || 'meta-llama/llama-3.3-70b-instruct:free',
    })
  }

  if (env.GROQ_API_KEY?.trim()) {
    chain.push({
      id: 'groq',
      kind: 'openai',
      baseUrl: 'https://api.groq.com/openai/v1',
      apiKey: env.GROQ_API_KEY.trim(),
      model: env.GROQ_MODEL?.trim() || 'llama-3.3-70b-versatile',
    })
  }

  const geminiKey = env.GEMINI_API_KEY?.trim() || env.GOOGLE_API_KEY?.trim()
  if (geminiKey) {
    chain.push({
      id: 'gemini',
      kind: 'gemini',
      apiKey: geminiKey,
      model: env.GEMINI_MODEL?.trim() || 'gemini-2.0-flash',
    })
  }

  return chain
}

export function resolveOpenAiKey(env: Record<string, string | undefined>): string | undefined {
  const upper = env.OPENAI_API_KEY?.trim()
  const lower = env.openai_api_key?.trim()
  return upper && upper.length > 0 ? upper : lower
}

export function resolveOpenAiBaseUrl(env: Record<string, string | undefined>): string {
  const raw = env.OPENAI_BASE_URL?.trim()
  if (raw && raw.length > 0) {
    return raw.replace(/\/$/, '')
  }
  return 'https://zenmux.ai/api/v1'
}

export function resolveOpenAiModel(env: Record<string, string | undefined>): string {
  const raw = env.OPENAI_MODEL?.trim()
  return raw && raw.length > 0 ? raw : DEFAULT_OPENAI_MODEL
}
