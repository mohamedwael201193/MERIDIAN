export { AiClient } from './ai-client.js'
export type { AiClientOptions } from './ai-client.js'
export { BackendClient } from './backend-client.js'
export type { BackendClientOptions } from './backend-client.js'
export { AgentCoordination } from './redis-coordination.js'
export { hashDecision, validateOrThrow } from './decision-recorder.js'
export type { DecisionRecord } from './decision-recorder.js'
export {
  yieldDecisionSchema,
  complianceDecisionSchema,
  auditReviewSchema,
  auditSummarySchema,
} from './schemas.js'
export type { YieldDecision, ComplianceDecision, AuditReview, AuditSummary } from './schemas.js'
export { loadAgentWallet, enforceAmountLimit } from './agent-wallet.js'
export type { AgentWallet, AgentAttestation } from './agent-wallet.js'
export { postAgentDecision } from './decision-poster.js'
