import { z } from 'zod'

export const yieldDecisionSchema = z.object({
  action: z.enum(['restake', 'hold', 'undelegate']),
  validatorPublicKey: z.string().min(66).max(66).optional(),
  amountMotes: z.string().regex(/^\d+$/),
  rationale: z.string().max(2000),
  confidence: z.number().min(0).max(1),
})

export type YieldDecision = z.infer<typeof yieldDecisionSchema>

export const complianceDecisionSchema = z.object({
  action: z.enum(['allow', 'revoke', 'review']),
  accountHash: z.string().min(10),
  sanctionsMatch: z.boolean(),
  rationale: z.string().max(2000),
  confidence: z.number().min(0).max(1),
})

export type ComplianceDecision = z.infer<typeof complianceDecisionSchema>

export const auditReviewSchema = z.object({
  approved: z.boolean(),
  summary: z.string().max(4000),
  riskLevel: z.enum(['low', 'medium', 'high', 'critical']),
  rationale: z.string().max(2000),
})

export type AuditReview = z.infer<typeof auditReviewSchema>

export const auditSummarySchema = z.object({
  summary: z.string().max(4000),
  eventCount: z.number().int().nonnegative(),
  highlights: z.array(z.string()).max(20),
})

export type AuditSummary = z.infer<typeof auditSummarySchema>
