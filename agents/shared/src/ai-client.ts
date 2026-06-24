import OpenAI from 'openai'
import type { z } from 'zod'
import { buildAiProviderChain } from '@meridian/env'
import { validateOrThrow } from './decision-recorder.js'

export interface AiClientOptions {
  env?: Record<string, string | undefined>
  apiKey?: string
  baseURL?: string
  model?: string
  timeoutMs?: number
  maxRetries?: number
}

export class AiClient {
  private readonly timeoutMs: number
  private readonly maxRetries: number
  private readonly env: Record<string, string | undefined>

  constructor(options: AiClientOptions = {}) {
    this.env = options.env ?? process.env
    this.timeoutMs = options.timeoutMs ?? 30_000
    this.maxRetries = options.maxRetries ?? 2
  }

  async structuredCompletion<T>(input: {
    system: string
    user: string
    schema: z.ZodType<T>
    label: string
  }): Promise<T> {
    const chain = buildAiProviderChain(this.env)
    if (chain.length === 0) {
      throw new Error('no_ai_providers_configured')
    }

    let lastError: unknown
    for (const provider of chain) {
      if (provider.kind !== 'openai') {
        continue
      }
      for (let attempt = 1; attempt <= this.maxRetries; attempt += 1) {
        try {
          const client = new OpenAI({
            apiKey: provider.apiKey,
            baseURL: provider.baseUrl,
            timeout: this.timeoutMs,
            maxRetries: 0,
          })
          const response = await client.chat.completions.create({
            model: provider.model,
            response_format: { type: 'json_object' },
            messages: [
              { role: 'system', content: input.system },
              { role: 'user', content: input.user },
            ],
            temperature: 0.1,
          })
          const content = response.choices[0]?.message?.content
          if (!content) {
            throw new Error('empty_llm_response')
          }
          const parsed = JSON.parse(content) as unknown
          return validateOrThrow(input.schema, parsed, input.label)
        } catch (error) {
          lastError = error
        }
      }
    }

    throw lastError instanceof Error ? lastError : new Error(`${input.label}_failed`)
  }
}
