import { describe, expect, it } from 'vitest'
import { withRetry } from '../../src/utils/retry.js'

describe('withRetry', () => {
  it('retries until success', async () => {
    let attempts = 0
    const result = await withRetry(
      async () => {
        attempts += 1
        if (attempts < 3) throw new Error('fail')
        return 'ok'
      },
      { attempts: 5, baseDelayMs: 1, maxDelayMs: 5, label: 'test' },
    )
    expect(result).toBe('ok')
    expect(attempts).toBe(3)
  })

  it('throws after max attempts', async () => {
    await expect(
      withRetry(async () => {
        throw new Error('always')
      }, { attempts: 2, baseDelayMs: 1, maxDelayMs: 5, label: 'test' }),
    ).rejects.toThrow('always')
  })
})
