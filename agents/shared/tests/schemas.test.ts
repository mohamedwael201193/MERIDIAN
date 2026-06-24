import { describe, expect, it } from 'vitest'
import {
  auditReviewSchema,
  complianceDecisionSchema,
  yieldDecisionSchema,
} from '../src/schemas.js'
import { validateOrThrow } from '../src/decision-recorder.js'

describe('agent schemas', () => {
  it('validates yield decision', () => {
    const decision = validateOrThrow(yieldDecisionSchema, {
      action: 'hold',
      amountMotes: '500000000000',
      rationale: 'insufficient new rewards',
      confidence: 0.9,
    }, 'yield')
    expect(decision.action).toBe('hold')
  })

  it('rejects invalid compliance decision', () => {
    expect(() =>
      validateOrThrow(complianceDecisionSchema, { action: 'bad' }, 'compliance'),
    ).toThrow()
  })

  it('audit review can reject unsafe yield', () => {
    const review = validateOrThrow(auditReviewSchema, {
      approved: false,
      summary: 'Rejected oversized restake',
      riskLevel: 'critical',
      rationale: 'amount exceeds policy',
    }, 'audit')
    expect(review.approved).toBe(false)
  })
})
