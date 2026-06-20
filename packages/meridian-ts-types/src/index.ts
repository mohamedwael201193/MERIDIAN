/** Auto-generated from Casper contract schemas — do not edit manually. */
export type ContractHash = `hash-${string}`;
export type PackageHash = `contract-package-${string}`;

// --- ComplianceRegistry ---
export interface Attestation {
  country: number;
  accredited: boolean;
  expires_at: bigint;
  sanctions_cleared: boolean;
}
export interface ComplianceOfficerChanged {
  officer: string;
}
export interface ComplianceOfficerScheduled {
  officer: string;
  executable_at: bigint;
}
export interface ComplianceRules {
  max_holders: number;
  jurisdictions: number[];
  require_accreditation: boolean;
  max_concentration_pct: number;
  sanctions_check: boolean;
}
export interface ContractUpgraded {
  upgraded_at: bigint;
}
export interface HolderRegistered {
  holder: string;
  country: number;
}
export interface HolderReinstated {
  holder: string;
}
export interface HolderRevoked {
  holder: string;
  reason: string;
}
export interface OwnershipTransferred {
  previous_owner: string | null;
  new_owner: string | null;
}
export interface RegistryInitialized {
  max_holders: number;
}
export interface RoleAdminChanged {
  role: unknown;
  previous_admin_role: unknown;
  new_admin_role: unknown;
}
export interface RoleGranted {
  role: unknown;
  address: string;
  sender: string;
}
export interface RoleRevoked {
  role: unknown;
  address: string;
  sender: string;
}
export interface RulesUpdateScheduled {
  executable_at: bigint;
}
export interface RulesUpdated {
  max_holders: number;
}
export interface TokenAddressSet {
  token: string;
}

export interface ComplianceRegistryEntryPoints {
  register_holder: { args: unknown; ret: void };
  revoke: { args: unknown; ret: void };
  reinstate: { args: unknown; ret: void };
  is_compliant: { args: unknown; ret: boolean };
  get_attestation: { args: unknown; ret: unknown | null };
  get_rules: { args: unknown; ret: unknown };
  update_rules: { args: unknown; ret: void };
  execute_rules_update: { args: unknown; ret: void };
  set_compliance_officer: { args: unknown; ret: void };
  execute_compliance_officer: { args: unknown; ret: void };
  set_token_address: { args: unknown; ret: void };
  schedule_upgrade: { args: unknown; ret: void };
  execute_upgrade: { args: unknown; ret: void };
}

// --- MeridianAudit ---
export interface AuditInitialized {
  initialized_at: bigint;
}
export interface AuditSignerChanged {
  signer: string;
}
export interface AuditSignerScheduled {
  signer: string;
  executable_at: bigint;
}
export interface AuditSummarySubmitted {
  summary_hash: unknown;
  submitter: string;
}
export interface ContractUpgraded {
  upgraded_at: bigint;
}
export interface OwnershipTransferred {
  previous_owner: string | null;
  new_owner: string | null;
}
export interface RoleAdminChanged {
  role: unknown;
  previous_admin_role: unknown;
  new_admin_role: unknown;
}
export interface RoleGranted {
  role: unknown;
  address: string;
  sender: string;
}
export interface RoleRevoked {
  role: unknown;
  address: string;
  sender: string;
}

export interface MeridianAuditEntryPoints {
  submit_summary: { args: unknown; ret: void };
  get_summary: { args: unknown; ret: number[] | null };
  get_latest_summaries: { args: unknown; ret: unknown[] };
  set_audit_signer: { args: unknown; ret: void };
  execute_audit_signer: { args: unknown; ret: void };
  schedule_upgrade: { args: unknown; ret: void };
  execute_upgrade: { args: unknown; ret: void };
}

// --- MeridianToken ---
export interface AssetMetadata {
  name: string;
  symbol: string;
  decimals: number;
}
export interface Burn {
  owner: string;
  amount: string;
}
export interface ContractUpgraded {
  upgraded_at: bigint;
}
export interface DecreaseAllowance {
  owner: string;
  spender: string;
  allowance: string;
  decr_by: string;
}
export interface HolderReinstatedEvent {
  holder: string;
}
export interface HolderRevokedEvent {
  holder: string;
}
export interface IncreaseAllowance {
  owner: string;
  spender: string;
  allowance: string;
  inc_by: string;
}
export interface Mint {
  recipient: string;
  amount: string;
}
export interface OwnershipTransferred {
  previous_owner: string | null;
  new_owner: string | null;
}
export interface SetAllowance {
  owner: string;
  spender: string;
  allowance: string;
}
export interface TokenIssued {
  issuer: string;
  total_supply: string;
}
export interface Transfer {
  sender: string;
  recipient: string;
  amount: string;
}
export interface TransferFrom {
  spender: string;
  owner: string;
  recipient: string;
  amount: string;
}
export interface YieldAccrued {
  holder: string;
  amount: string;
}

export interface MeridianTokenEntryPoints {
  set_staking_vault: { args: unknown; ret: void };
  set_compliance_registry: { args: unknown; ret: void };
  accrue_yield: { args: unknown; ret: void };
  revoke_holder: { args: unknown; ret: void };
  reinstate_holder: { args: unknown; ret: void };
  is_revoked: { args: unknown; ret: boolean };
  transfer: { args: unknown; ret: void };
  transfer_from: { args: unknown; ret: void };
  schedule_upgrade: { args: unknown; ret: void };
  execute_upgrade: { args: unknown; ret: void };
  name: { args: unknown; ret: string };
  symbol: { args: unknown; ret: string };
  decimals: { args: unknown; ret: number };
  total_supply: { args: unknown; ret: string };
  balance_of: { args: unknown; ret: string };
  allowance: { args: unknown; ret: string };
  approve: { args: unknown; ret: void };
  decrease_allowance: { args: unknown; ret: void };
  increase_allowance: { args: unknown; ret: void };
}

// --- StakingVault ---
export interface ContractUpgraded {
  upgraded_at: bigint;
}
export interface DepositReceived {
  depositor: string;
  amount: string;
}
export interface OwnershipTransferred {
  previous_owner: string | null;
  new_owner: string | null;
}
export interface Restaked {
  from: string;
  to: string;
  amount: string;
}
export interface RewardsClaimed {
  amount: string;
}
export interface RoleAdminChanged {
  role: unknown;
  previous_admin_role: unknown;
  new_admin_role: unknown;
}
export interface RoleGranted {
  role: unknown;
  address: string;
  sender: string;
}
export interface RoleRevoked {
  role: unknown;
  address: string;
  sender: string;
}
export interface Staked {
  depositor: string;
  validator: string;
  amount: string;
}
export interface Undelegated {
  validator: string;
  amount: string;
}
export interface ValidatorCuratorChanged {
  curator: string;
}
export interface ValidatorCuratorScheduled {
  curator: string;
  executable_at: bigint;
}
export interface VaultInitialized {
  token: string;
  validator: string;
}

export interface StakingVaultEntryPoints {
  set_yield_distributor: { args: unknown; ret: void };
  deposit: { args: unknown; ret: void };
  restake: { args: unknown; ret: void };
  undelegate: { args: unknown; ret: void };
  claim_rewards: { args: unknown; ret: string };
  distribute_rewards: { args: unknown; ret: void };
  set_validator_curator: { args: unknown; ret: void };
  execute_validator_curator: { args: unknown; ret: void };
  forward_distribute: { args: unknown; ret: void };
  get_validator: { args: unknown; ret: string };
  get_total_staked: { args: unknown; ret: string };
  schedule_upgrade: { args: unknown; ret: void };
  execute_upgrade: { args: unknown; ret: void };
}

// --- YieldDistributor ---
export interface ContractUpgraded {
  upgraded_at: bigint;
}
export interface DistributorInitialized {
  token: string;
  vault: string;
  treasury: string;
}
export interface HolderRegisteredForYield {
  holder: string;
}
export interface OwnershipTransferred {
  previous_owner: string | null;
  new_owner: string | null;
}
export interface ProtocolFeeChanged {
  bps: number;
}
export interface ProtocolFeeScheduled {
  bps: number;
  executable_at: bigint;
}
export interface YieldDistributed {
  holder: string;
  amount: string;
}

export interface YieldDistributorEntryPoints {
  register_holder: { args: unknown; ret: void };
  distribute: { args: unknown; ret: void };
  pending_yield: { args: unknown; ret: string };
  get_protocol_fee_bps: { args: unknown; ret: number };
  set_protocol_fee_bps: { args: unknown; ret: void };
  execute_protocol_fee_bps: { args: unknown; ret: void };
  schedule_upgrade: { args: unknown; ret: void };
  execute_upgrade: { args: unknown; ret: void };
}

export interface DeployedContracts {
  ComplianceRegistry: { package_hash: PackageHash };
  MeridianAudit: { package_hash: PackageHash };
  MeridianToken: { package_hash: PackageHash };
  StakingVault: { package_hash: PackageHash };
  YieldDistributor: { package_hash: PackageHash };
}

