export interface RetryOptions {
  attempts: number
  baseDelayMs: number
  maxDelayMs: number
  label: string
  shouldRetry?: (error: unknown) => boolean
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions,
): Promise<T> {
  let lastError: unknown
  for (let attempt = 1; attempt <= options.attempts; attempt += 1) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      const retryable = options.shouldRetry?.(error) ?? true
      if (!retryable || attempt === options.attempts) {
        break
      }
      const delay = Math.min(
        options.maxDelayMs,
        options.baseDelayMs * 2 ** (attempt - 1),
      )
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error(`${options.label} failed after ${options.attempts} attempts`)
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
