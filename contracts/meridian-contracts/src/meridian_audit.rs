use crate::timelock::{assert_elapsed, schedule_at, TimelockError};
use meridian_types::{Hash, PendingAddressChange, AUDIT_SIGNER_ROLE, DEFAULT_ADMIN_ROLE};
use odra::casper_types::bytesrepr::Bytes;
use odra::prelude::*;
use odra_modules::access::{AccessControl, Ownable};

/// MeridianAudit errors.
#[odra::odra_error]
pub enum Error {
    SummaryNotFound = 34_000,
    NothingScheduled = 34_001,
}

#[odra::event]
pub struct AuditInitialized {
    pub initialized_at: u64,
}

#[odra::event]
pub struct AuditSummarySubmitted {
    pub summary_hash: Hash,
    pub submitter: Address,
}

#[odra::event]
pub struct AuditSignerChanged {
    pub signer: Address,
}

#[odra::event]
pub struct AuditSignerScheduled {
    pub signer: Address,
    pub executable_at: u64,
}

#[odra::event]
pub struct ContractUpgraded {
    pub upgraded_at: u64,
}

#[odra::module(
    events = [
        AuditInitialized,
        AuditSummarySubmitted,
        AuditSignerChanged,
        AuditSignerScheduled,
        ContractUpgraded,
    ],
    errors = Error
)]
pub struct MeridianAudit {
    ownable: SubModule<Ownable>,
    access: SubModule<AccessControl>,
    summaries: Mapping<Hash, Bytes>,
    summary_index: List<Hash>,
    audit_signer: Var<Option<Address>>,
    pending_signer: Var<Option<PendingAddressChange>>,
    pending_upgrade_at: Var<Option<u64>>,
}

#[odra::module]
impl MeridianAudit {
    pub fn init(&mut self) {
        let caller = self.env().caller();
        self.ownable.init(caller);
        self.access
            .unchecked_grant_role(&DEFAULT_ADMIN_ROLE, &caller);
        self.access
            .set_admin_role(&AUDIT_SIGNER_ROLE, &DEFAULT_ADMIN_ROLE);
        self.audit_signer.set(None);
        self.env().emit_event(AuditInitialized {
            initialized_at: self.env().get_block_time(),
        });
    }

    pub fn submit_summary(&mut self, summary_hash: Hash, summary_payload: Bytes) {
        self.access
            .check_role(&AUDIT_SIGNER_ROLE, &self.env().caller());
        let submitter = self.env().caller();
        self.summaries.set(&summary_hash, summary_payload);
        self.summary_index.push(summary_hash);
        self.env().emit_event(AuditSummarySubmitted {
            summary_hash,
            submitter,
        });
    }

    pub fn get_summary(&self, summary_hash: Hash) -> Option<Bytes> {
        self.summaries.get(&summary_hash)
    }

    pub fn get_latest_summaries(&self, count: u32) -> Vec<Hash> {
        let len = self.summary_index.len();
        if len == 0 || count == 0 {
            return Vec::new();
        }
        let take = count.min(len);
        let start = len - take;
        let mut out = Vec::new();
        for i in start..len {
            if let Some(hash) = self.summary_index.get(i) {
                out.push(hash);
            }
        }
        out
    }

    pub fn set_audit_signer(&mut self, addr: Address) {
        self.ownable.assert_owner(&self.env().caller());
        let executable_at = schedule_at(&self.env());
        self.pending_signer.set(Some(PendingAddressChange {
            value: addr,
            executable_at,
        }));
        self.env().emit_event(AuditSignerScheduled {
            signer: addr,
            executable_at,
        });
    }

    pub fn execute_audit_signer(&mut self) {
        self.ownable.assert_owner(&self.env().caller());
        let pending = self
            .pending_signer
            .get()
            .flatten()
            .unwrap_or_revert_with(&self.env(), Error::NothingScheduled);
        assert_elapsed(&self.env(), pending.executable_at);
        if let Some(previous) = self.audit_signer.get().flatten() {
            self.access
                .unchecked_revoke_role(&AUDIT_SIGNER_ROLE, &previous);
        }
        self.access
            .unchecked_grant_role(&AUDIT_SIGNER_ROLE, &pending.value);
        self.audit_signer.set(Some(pending.value));
        self.pending_signer.set(None);
        self.env().emit_event(AuditSignerChanged {
            signer: pending.value,
        });
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

#[cfg(test)]
mod tests {
    use super::*;
    use meridian_types::TIMELOCK_DURATION_MS;
    use crate::test_helpers::deploy_audit;
    use odra::casper_types::bytesrepr::Bytes;

    fn sample_hash(byte: u8) -> Hash {
        [byte; 32]
    }

    #[test]
    fn init_emits_event() {
        let env = odra_test::env();
        let audit = deploy_audit(&env);
        assert!(env.emitted_event(
            &audit,
            AuditInitialized {
                initialized_at: env.block_time(),
            }
        ));
    }

    #[test]
    fn submit_and_get_summary() {
        let env = odra_test::env();
        let mut audit = deploy_audit(&env);
        let signer = env.get_account(2);
        audit.set_audit_signer(signer);
        env.advance_block_time(TIMELOCK_DURATION_MS);
        audit.execute_audit_signer();

        env.set_caller(signer);
        let hash = sample_hash(1);
        let payload = Bytes::from(vec![1, 2, 3]);
        audit.submit_summary(hash, payload.clone());
        assert_eq!(audit.get_summary(hash), Some(payload));
    }

    #[test]
    fn submit_requires_audit_signer() {
        let env = odra_test::env();
        let mut audit = deploy_audit(&env);
        env.set_caller(env.get_account(5));
        assert!(audit
            .try_submit_summary(sample_hash(2), Bytes::from(vec![9]))
            .is_err());
    }

    #[test]
    fn get_latest_summaries_returns_recent() {
        let env = odra_test::env();
        let mut audit = deploy_audit(&env);
        let signer = env.get_account(2);
        audit.set_audit_signer(signer);
        env.advance_block_time(TIMELOCK_DURATION_MS);
        audit.execute_audit_signer();
        env.set_caller(signer);
        audit.submit_summary(sample_hash(1), Bytes::from(vec![1]));
        audit.submit_summary(sample_hash(2), Bytes::from(vec![2]));
        let latest = audit.get_latest_summaries(1);
        assert_eq!(latest.len(), 1);
        assert_eq!(latest[0], sample_hash(2));
    }

    #[test]
    fn audit_signer_timelock() {
        let env = odra_test::env();
        let mut audit = deploy_audit(&env);
        audit.set_audit_signer(env.get_account(3));
        assert!(audit.try_execute_audit_signer().is_err());
        env.advance_block_time(TIMELOCK_DURATION_MS);
        audit.execute_audit_signer();
        assert!(env.emitted_event(
            &audit,
            AuditSignerChanged {
                signer: env.get_account(3),
            }
        ));
    }

    #[test]
    fn upgrade_timelock() {
        let env = odra_test::env();
        let mut audit = deploy_audit(&env);
        audit.schedule_upgrade();
        assert!(audit.try_execute_upgrade().is_err());
        env.advance_block_time(TIMELOCK_DURATION_MS);
        audit.execute_upgrade();
        assert!(env.emitted_event(
            &audit,
            ContractUpgraded {
                upgraded_at: env.block_time(),
            }
        ));
    }
}
