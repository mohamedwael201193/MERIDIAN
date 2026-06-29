use odra::prelude::*;

/// 32-byte content hash (audit summaries, upgrade package hashes).
pub type Hash = [u8; 32];

/// ISO 3166-1 numeric country code (stored as u32 for Casper CL compatibility).
pub type Country = u32;

/// ERC-3643-style compliance configuration.
#[odra::odra_type]
pub struct ComplianceRules {
    pub max_holders: u32,
    pub jurisdictions: Vec<Country>,
    pub require_accreditation: bool,
    pub max_concentration_pct: u8,
    pub sanctions_check: bool,
}

impl ComplianceRules {
    /// Permissive defaults for test deployments.
    pub fn default_permissive() -> Self {
        Self {
            max_holders: u32::MAX,
            jurisdictions: Vec::new(),
            require_accreditation: false,
            max_concentration_pct: 100,
            sanctions_check: false,
        }
    }
}

impl Default for ComplianceRules {
    fn default() -> Self {
        Self::default_permissive()
    }
}

/// Holder identity attestation stored in ComplianceRegistry.
#[odra::odra_type]
pub struct Attestation {
    pub country: Country,
    pub accredited: bool,
    pub expires_at: u64,
    pub sanctions_cleared: bool,
}

/// CEP-18 token metadata for MeridianToken initialization.
#[odra::odra_type]
pub struct AssetMetadata {
    pub name: String,
    pub symbol: String,
    pub decimals: u8,
}

/// Scheduled timelock action targeting an address.
#[odra::odra_type]
pub struct PendingAddressChange {
    pub value: Address,
    pub executable_at: u64,
}

/// Scheduled timelock action for ComplianceRules.
#[odra::odra_type]
pub struct PendingRulesChange {
    pub value: ComplianceRules,
    pub executable_at: u64,
}

/// Scheduled timelock action for a protocol fee parameter (basis points).
#[odra::odra_type]
pub struct PendingU32Change {
    pub value: u32,
    pub executable_at: u64,
}
