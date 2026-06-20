use crate::meridian_token::MeridianTokenContractRef;
use crate::timelock::{assert_elapsed, schedule_at, TimelockError};
use meridian_types::{
    Attestation, ComplianceRules, PendingAddressChange, PendingRulesChange,
    COMPLIANCE_OFFICER_ROLE, DEFAULT_ADMIN_ROLE,
};
use odra::prelude::*;
use odra::ContractRef;
use odra_modules::access::{AccessControl, Ownable};

/// ComplianceRegistry errors.
#[odra::odra_error]
pub enum Error {
    HolderNotRegistered = 30_000,
    HolderAlreadyRegistered = 30_001,
    HolderRevoked = 30_002,
    HolderNotRevoked = 30_003,
    MaxHoldersReached = 30_004,
    AttestationExpired = 30_005,
    JurisdictionNotAllowed = 30_006,
    AccreditationRequired = 30_007,
    SanctionsNotCleared = 30_008,
    TokenNotSet = 30_009,
    NothingScheduled = 30_010,
}

#[odra::event]
pub struct RegistryInitialized {
    pub max_holders: u32,
}

#[odra::event]
pub struct HolderRegistered {
    pub holder: Address,
    pub country: u32,
}

#[odra::event]
pub struct HolderRevoked {
    pub holder: Address,
    pub reason: String,
}

#[odra::event]
pub struct HolderReinstated {
    pub holder: Address,
}

#[odra::event]
pub struct RulesUpdated {
    pub max_holders: u32,
}

#[odra::event]
pub struct RulesUpdateScheduled {
    pub executable_at: u64,
}

#[odra::event]
pub struct ComplianceOfficerChanged {
    pub officer: Address,
}

#[odra::event]
pub struct ComplianceOfficerScheduled {
    pub officer: Address,
    pub executable_at: u64,
}

#[odra::event]
pub struct TokenAddressSet {
    pub token: Address,
}

#[odra::event]
pub struct ContractUpgraded {
    pub upgraded_at: u64,
}

#[odra::module(
    events = [
        RegistryInitialized,
        HolderRegistered,
        HolderRevoked,
        HolderReinstated,
        RulesUpdated,
        RulesUpdateScheduled,
        ComplianceOfficerChanged,
        ComplianceOfficerScheduled,
        TokenAddressSet,
        ContractUpgraded,
    ],
    errors = Error
)]
pub struct ComplianceRegistry {
    ownable: SubModule<Ownable>,
    access: SubModule<AccessControl>,
    rules: Var<ComplianceRules>,
    attestations: Mapping<Address, Attestation>,
    revoked: Mapping<Address, bool>,
    holder_count: Var<u32>,
    token: Var<Option<Address>>,
    compliance_officer: Var<Option<Address>>,
    pending_rules: Var<Option<PendingRulesChange>>,
    pending_officer: Var<Option<PendingAddressChange>>,
    pending_upgrade_at: Var<Option<u64>>,
}

#[odra::module]
impl ComplianceRegistry {
    pub fn init(&mut self, rules: ComplianceRules) {
        let caller = self.env().caller();
        self.ownable.init(caller);
        self.access
            .unchecked_grant_role(&DEFAULT_ADMIN_ROLE, &caller);
        self.access
            .set_admin_role(&COMPLIANCE_OFFICER_ROLE, &DEFAULT_ADMIN_ROLE);
        self.rules.set(rules.clone());
        self.holder_count.set(0);
        self.compliance_officer.set(None);
        self.env().emit_event(RegistryInitialized {
            max_holders: rules.max_holders,
        });
    }

    pub fn register_holder(&mut self, addr: Address, attestation: Attestation) {
        self.ownable.assert_owner(&self.env().caller());
        if self.attestations.get(&addr).is_some() {
            self.env().revert(Error::HolderAlreadyRegistered);
        }
        let count = self.holder_count.get_or_default();
        if count >= self.rules.get_or_default().max_holders {
            self.env().revert(Error::MaxHoldersReached);
        }
        self.validate_attestation(&attestation);
        self.attestations.set(&addr, attestation.clone());
        self.revoked.set(&addr, false);
        self.holder_count.set(count + 1);
        self.env().emit_event(HolderRegistered {
            holder: addr,
            country: attestation.country,
        });
    }

    pub fn revoke(&mut self, addr: Address, reason: String) {
        self.access.check_role(&COMPLIANCE_OFFICER_ROLE, &self.env().caller());
        if self.attestations.get(&addr).is_none() {
            self.env().revert(Error::HolderNotRegistered);
        }
        if self.revoked.get_or_default(&addr) {
            self.env().revert(Error::HolderRevoked);
        }
        self.revoked.set(&addr, true);
        if let Some(token) = self.token.get().flatten() {
            MeridianTokenContractRef::new(self.env(), token).revoke_holder(addr);
        }
        self.env().emit_event(HolderRevoked { holder: addr, reason });
    }

    pub fn reinstate(&mut self, addr: Address) {
        self.access.check_role(&COMPLIANCE_OFFICER_ROLE, &self.env().caller());
        if self.attestations.get(&addr).is_none() {
            self.env().revert(Error::HolderNotRegistered);
        }
        if !self.revoked.get_or_default(&addr) {
            self.env().revert(Error::HolderNotRevoked);
        }
        self.revoked.set(&addr, false);
        if let Some(token) = self.token.get().flatten() {
            MeridianTokenContractRef::new(self.env(), token).reinstate_holder(addr);
        }
        self.env().emit_event(HolderReinstated { holder: addr });
    }

    pub fn is_compliant(&self, addr: Address) -> bool {
        if self.revoked.get_or_default(&addr) {
            return false;
        }
        let Some(attestation) = self.attestations.get(&addr) else {
            return false;
        };
        self.check_attestation_rules(&attestation)
    }

    pub fn get_attestation(&self, addr: Address) -> Option<Attestation> {
        self.attestations.get(&addr)
    }

    pub fn get_rules(&self) -> ComplianceRules {
        self.rules.get_or_default()
    }

    pub fn update_rules(&mut self, new_rules: ComplianceRules) {
        self.ownable.assert_owner(&self.env().caller());
        let executable_at = schedule_at(&self.env());
        self.pending_rules.set(Some(PendingRulesChange {
            value: new_rules,
            executable_at,
        }));
        self.env().emit_event(RulesUpdateScheduled { executable_at });
    }

    pub fn execute_rules_update(&mut self) {
        self.ownable.assert_owner(&self.env().caller());
        let pending = self
            .pending_rules
            .get()
            .flatten()
            .unwrap_or_revert_with(&self.env(), Error::NothingScheduled);
        assert_elapsed(&self.env(), pending.executable_at);
        self.rules.set(pending.value.clone());
        self.pending_rules.set(None);
        self.env().emit_event(RulesUpdated {
            max_holders: pending.value.max_holders,
        });
    }

    pub fn set_compliance_officer(&mut self, addr: Address) {
        self.ownable.assert_owner(&self.env().caller());
        let executable_at = schedule_at(&self.env());
        self.pending_officer.set(Some(PendingAddressChange {
            value: addr,
            executable_at,
        }));
        self.env().emit_event(ComplianceOfficerScheduled {
            officer: addr,
            executable_at,
        });
    }

    pub fn execute_compliance_officer(&mut self) {
        self.ownable.assert_owner(&self.env().caller());
        let pending = self
            .pending_officer
            .get()
            .flatten()
            .unwrap_or_revert_with(&self.env(), Error::NothingScheduled);
        assert_elapsed(&self.env(), pending.executable_at);
        if let Some(previous) = self.compliance_officer.get().flatten() {
            self.access
                .unchecked_revoke_role(&COMPLIANCE_OFFICER_ROLE, &previous);
        }
        self.access
            .unchecked_grant_role(&COMPLIANCE_OFFICER_ROLE, &pending.value);
        self.compliance_officer.set(Some(pending.value));
        self.pending_officer.set(None);
        self.env().emit_event(ComplianceOfficerChanged {
            officer: pending.value,
        });
    }

    pub fn set_token_address(&mut self, token: Address) {
        self.ownable.assert_owner(&self.env().caller());
        self.token.set(Some(token));
        self.env().emit_event(TokenAddressSet { token });
    }

    pub fn schedule_upgrade(&mut self) {
        self.ownable.assert_owner(&self.env().caller());
        self.pending_upgrade_at.set(Some(schedule_at(&self.env())));
    }

    pub fn execute_upgrade(&mut self) {
        let executable_at = self
            .pending_upgrade_at
            .get()
            .flatten()
            .unwrap_or_revert_with(&self.env(), TimelockError::NothingScheduled);
        assert_elapsed(&self.env(), executable_at);
        self.pending_upgrade_at.set(None);
        self.env().emit_event(ContractUpgraded {
            upgraded_at: self.env().get_block_time(),
        });
    }
}

impl ComplianceRegistry {
    fn validate_attestation(&self, attestation: &Attestation) {
        if !self.check_attestation_rules(attestation) {
            if self.rules.get_or_default().require_accreditation && !attestation.accredited {
                self.env().revert(Error::AccreditationRequired);
            }
            if self.rules.get_or_default().sanctions_check && !attestation.sanctions_cleared {
                self.env().revert(Error::SanctionsNotCleared);
            }
            if self.env().get_block_time() >= attestation.expires_at {
                self.env().revert(Error::AttestationExpired);
            }
            let jurisdictions = &self.rules.get_or_default().jurisdictions;
            if !jurisdictions.is_empty() && !jurisdictions.contains(&attestation.country) {
                self.env().revert(Error::JurisdictionNotAllowed);
            }
        }
    }

    fn check_attestation_rules(&self, attestation: &Attestation) -> bool {
        let rules = self.rules.get_or_default();
        if self.env().get_block_time() >= attestation.expires_at {
            return false;
        }
        if rules.require_accreditation && !attestation.accredited {
            return false;
        }
        if rules.sanctions_check && !attestation.sanctions_cleared {
            return false;
        }
        if !rules.jurisdictions.is_empty()
            && !rules.jurisdictions.contains(&attestation.country)
        {
            return false;
        }
        true
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use meridian_types::TIMELOCK_DURATION_MS;
    use crate::test_helpers::{
        deploy_registry, deploy_registry_with_rules, sample_attestation,
    };
    use meridian_types::ComplianceRules;

    #[test]
    fn init_emits_registry_initialized() {
        let env = odra_test::env();
        let contract = deploy_registry(&env);
        assert!(env.emitted_event(
            &contract,
            RegistryInitialized {
                max_holders: u32::MAX,
            }
        ));
    }

    #[test]
    fn register_and_is_compliant() {
        let env = odra_test::env();
        let mut contract = deploy_registry(&env);
        let holder = env.get_account(1);
        contract.register_holder(holder, sample_attestation(&env));
        assert!(contract.is_compliant(holder));
    }

    #[test]
    fn revoke_blocks_compliance() {
        let env = odra_test::env();
        let mut contract = deploy_registry(&env);
        let officer = env.get_account(2);
        let holder = env.get_account(1);

        contract.register_holder(holder, sample_attestation(&env));
        contract.set_compliance_officer(officer);
        env.advance_block_time(TIMELOCK_DURATION_MS);
        contract.execute_compliance_officer();

        env.set_caller(officer);
        contract.revoke(holder, "sanctions".to_string());
        assert!(!contract.is_compliant(holder));
    }

    #[test]
    fn permission_register_requires_owner() {
        let env = odra_test::env();
        let mut contract = deploy_registry(&env);
        let stranger = env.get_account(3);
        env.set_caller(stranger);
        let result = contract.try_register_holder(stranger, sample_attestation(&env));
        assert!(result.is_err());
    }

    #[test]
    fn timelock_blocks_rules_update() {
        let env = odra_test::env();
        let mut contract = deploy_registry(&env);
        let mut new_rules = ComplianceRules::default_permissive();
        new_rules.max_holders = 10;
        contract.update_rules(new_rules);
        assert!(contract.try_execute_rules_update().is_err());
        env.advance_block_time(TIMELOCK_DURATION_MS);
        contract.execute_rules_update();
        assert_eq!(contract.get_rules().max_holders, 10);
    }

    #[test]
    fn max_holders_enforced() {
        let env = odra_test::env();
        let mut rules = ComplianceRules::default_permissive();
        rules.max_holders = 1;
        let mut contract = deploy_registry_with_rules(&env, rules);
        contract.register_holder(env.get_account(1), sample_attestation(&env));
        assert!(contract
            .try_register_holder(env.get_account(2), sample_attestation(&env))
            .is_err());
    }

    #[test]
    fn expired_attestation_not_compliant() {
        let env = odra_test::env();
        let mut contract = deploy_registry(&env);
        let holder = env.get_account(1);
        let mut att = sample_attestation(&env);
        att.expires_at = env.block_time() + 1_000;
        contract.register_holder(holder, att);
        env.advance_block_time(2_000);
        assert!(!contract.is_compliant(holder));
    }
}
