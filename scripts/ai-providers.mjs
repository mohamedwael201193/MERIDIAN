/**
 * AI provider chain — priority order with OpenAI-compatible + Gemini adapters.
 * Used by verify-phase1.mjs; mirrored in @meridian/env for Phase 6 agents.
 */

const TEST_PROMPT = 'Reply with exactly: MERIDIAN_OK'

export function buildAiProviderChain(env) {
  const chain = []

  const zenmuxKey = env.OPENAI_API_KEY?.trim() || env.openai_api_key?.trim()
  if (zenmuxKey) {
    chain.push({
      id: 'zenmux',
      kind: 'openai',
      baseUrl: (env.OPENAI_BASE_URL?.trim() || 'https://zenmux.ai/api/v1').replace(/\/$/, ''),
      apiKey: zenmuxKey,
      model: env.OPENAI_MODEL?.trim() || 'z-ai/glm-5.2-free',
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

function extractOpenAiContent(body) {
  const msg = body?.choices?.[0]?.message
  const text = msg?.content?.trim() || msg?.reasoning?.trim()
  return text && text.length > 0 ? text : undefined
}

function extractGeminiContent(body) {
  return body?.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
}

function formatError(status, body) {
  return body?.error?.message || body?.message || body?.error?.type || `HTTP ${status}`
}

export async function chatWithProvider(provider) {
  if (provider.kind === 'gemini') {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${provider.model}:generateContent?key=${provider.apiKey}`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: TEST_PROMPT }] }],
        generationConfig: { maxOutputTokens: 32, temperature: 0 },
      }),
    })
    const body = await res.json().catch(() => ({}))
    const content = extractGeminiContent(body)
    return {
      ok: res.ok && Boolean(content),
      status: res.status,
      content,
      detail: content
        ? `chat OK (${provider.model})`
        : formatError(res.status, body?.error ? { error: body.error } : body),
    }
  }

  const res = await fetch(`${provider.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${provider.apiKey}`,
    },
    body: JSON.stringify({
      model: provider.model,
      messages: [{ role: 'user', content: TEST_PROMPT }],
      max_tokens: 64,
      temperature: 0,
    }),
  })
  const body = await res.json().catch(() => ({}))
  const content = extractOpenAiContent(body)
  return {
    ok: res.ok && Boolean(content),
    status: res.status,
    content,
    detail: content ? `chat OK (${provider.model})` : formatError(res.status, body),
  }
}

export async function verifyAiProviderChain(env) {
  const chain = buildAiProviderChain(env)
  const attempts = []

  for (const provider of chain) {
    try {
      const result = await chatWithProvider(provider)
      attempts.push({ provider: provider.id, model: provider.model, ...result })
      if (result.ok) {
        return { ok: true, winner: provider, attempts }
      }
    } catch (err) {
      attempts.push({
        provider: provider.id,
        model: provider.model,
        ok: false,
        detail: err instanceof Error ? err.message : String(err),
      })
    }
  }

  return { ok: false, winner: null, attempts }
}
