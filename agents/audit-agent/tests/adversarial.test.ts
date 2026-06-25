import { describe, expect, it } from 'vitest'
import { auditReviewSchema } from '@meridian/agents-shared'
import { validateOrThrow } from '../shared/src/decision-recorder.js'

describe('adversarial audit', () => {
  it('blocks unsafe restake amount', () => {
    const review = validateOrThrow(auditReviewSchema, {
      approved: false,
      summary: 'Reject restake — amount exceeds vault policy and whitelist constraints',
      riskLevel: 'critical',
      rationale: 'amountMotes too large relative to total staked',
    }, 'audit')
    expect(review.approved).toBe(false)
    expect(review.riskLevel).toBe('critical')
  })
})
