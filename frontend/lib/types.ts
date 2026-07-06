export interface ApiEnvelope<T> {
  data: T
}

export interface ApiErrorEnvelope {
  error: { code: string; message: string }
}

export interface TokenRow {
  id: string
  package_hash: string
  contract_name: string
  symbol: string | null
  total_supply: string
  total_staked: string
  created_at: string
  updated_at: string
}

export interface HolderRow {
  id: string
  account_hash: string
  country: number | null
  accredited: boolean
  sanctions_cleared: boolean
  status: string
  registered_at: string | null
  revoked_at: string | null
  revoke_reason: string | null
  created_at: string
  updated_at: string
}

export interface ComplianceStatus {
  accountHash: string
  status: string
  compliant: boolean
  country?: number | null
  accredited?: boolean
  registeredAt?: string | null
  revokedAt?: string | null
  revokeReason?: string | null
}

export interface YieldInfo {
  packageHash: string
  contractName: string
  totalStaked: string
  totalSupply: string
  recentEras: number
  estimatedApyBps: number
  lastDistribution: {
    era_id: string
    block_height: string
    transaction_hash: string
    total_rewards: string
    protocol_fee: string
    distributed_at: string
  } | null
}

export interface YieldHistoryItem {
  eraId: number
  blockHeight: number
  totalRewards: string
  protocolFee: string
  transactionHash: string
  distributedAt: string
}

export interface MeridianEventRow {
  id: string
  contract_name: string
  contract_package_hash: string
  contract_hash: string | null
  event_name: string
  event_data: Record<string, unknown>
  raw_data: string | null
  block_height: string
  event_id: string
  transform_id: string | null
  transaction_hash: string
  indexed_at: string
}

export interface AuditSummaryRow {
  id: string
  period_start: string
  period_end: string
  summary: string
  decision_hash: string
  transaction_hash: string | null
  agent_public_key: string | null
  event_count: number
  created_at: string
}

export interface AgentDecisionRow {
  id: string
  agent_name: string
  decision_hash: string
  decision_type: string
  payload: Record<string, unknown>
  approved: boolean | null
  reviewed_by: string | null
  created_at: string
  attestation?: {
    agent: string
    publicKey: string
    accountHash: string
    digest: string
    signature: string
  }
}

export interface UnsignedTransaction {
  network: string
  chainName: string
  transactionType: string
  transaction: unknown
  note: string
  attachedValueMotes?: string
  requiredRole?: string
  expectedResult?: string
  explorerHint?: string
}

export interface AgentTraceRow {
  id: string
  session_id: string
  agent_name: string
  step_type: string
  message: string
  payload: Record<string, unknown>
  created_at: string
}

export interface BackendHealth {
  status: string
  events_indexed?: number
  [key: string]: unknown
}
