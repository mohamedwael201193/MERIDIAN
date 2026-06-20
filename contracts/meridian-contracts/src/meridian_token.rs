use crate::compliance_registry::ComplianceRegistryContractRef;
use crate::timelock::{assert_elapsed, schedule_at, TimelockError};
use meridian_types::AssetMetadata;
use odra::casper_types::U256;
use odra::prelude::*;
use odra::ContractRef;
use odra_modules::access::Ownable;
use odra_modules::cep18_token::Cep18;

/// MeridianToken errors.
#[odra::odra_error]
pub enum Error {
    NotStakingVault = 31_000,
    NotComplianceRegistry = 31_001,
    HolderRevoked = 31_002,
    NotCompliant = 31_003,
    StakingVaultNotSet = 31_004,
    ComplianceRegistryNotSet = 31_005,
    Overflow = 31_006,
}

#[odra::event]
pub struct TokenIssued {
    pub issuer: Address,
    pub total_supply: U256,
}

#[odra::event]
pub struct YieldAccrued {
    pub holder: Address,
    pub amount: U256,
}

#[odra::event]
pub struct HolderRevokedEvent {
    pub holder: Address,
}

#[odra::event]
pub struct HolderReinstatedEvent {
    pub holder: Address,
}

#[odra::event]
pub struct ContractUpgraded {
    pub upgraded_at: u64,
}

#[odra::module(
    events = [
        TokenIssued,
        YieldAccrued,
        HolderRevokedEvent,
        HolderReinstatedEvent,
        ContractUpgraded,
    ],
    errors = Error
)]
pub struct MeridianToken {
    ownable: SubModule<Ownable>,
    token: SubModule<Cep18>,
    compliance_registry: Var<Option<Address>>,
    staking_vault: Var<Option<Address>>,
    revoked: Mapping<Address, bool>,
    pending_upgrade_at: Var<Option<u64>>,
}

#[odra::module]
impl MeridianToken {
    pub fn init(&mut self, metadata: AssetMetadata, initial_supply: U256, compliance_registry: Address) {
        let caller = self.env().caller();
        self.ownable.init(caller);
        self.token
            .init(metadata.symbol, metadata.name, metadata.decimals, initial_supply);
        self.compliance_registry.set(Some(compliance_registry));
        self.staking_vault.set(None);
        self.env().emit_event(TokenIssued {
            issuer: caller,
            total_supply: initial_supply,
        });
    }

    pub fn set_staking_vault(&mut self, vault: Address) {
        self.ownable.assert_owner(&self.env().caller());
        self.staking_vault.set(Some(vault));
    }

    pub fn set_compliance_registry(&mut self, registry: Address) {
        self.ownable.assert_owner(&self.env().caller());
        self.compliance_registry.set(Some(registry));
    }

    pub fn accrue_yield(&mut self, holder: Address, amount: U256) {
        let vault = self
            .staking_vault
            .get()
            .flatten()
            .unwrap_or_revert_with(&self.env(), Error::StakingVaultNotSet);
        if self.env().caller() != vault {
            self.env().revert(Error::NotStakingVault);
        }
        self.token.raw_mint(&holder, &amount);
        self.env().emit_event(YieldAccrued { holder, amount });
    }

    pub fn revoke_holder(&mut self, addr: Address) {
        let registry = self
            .compliance_registry
            .get()
            .flatten()
            .unwrap_or_revert_with(&self.env(), Error::ComplianceRegistryNotSet);
        if self.env().caller() != registry {
            self.env().revert(Error::NotComplianceRegistry);
        }
        self.revoked.set(&addr, true);
        self.env().emit_event(HolderRevokedEvent { holder: addr });
    }

    pub fn reinstate_holder(&mut self, addr: Address) {
        let registry = self
            .compliance_registry
            .get()
            .flatten()
            .unwrap_or_revert_with(&self.env(), Error::ComplianceRegistryNotSet);
        if self.env().caller() != registry {
            self.env().revert(Error::NotComplianceRegistry);
        }
        self.revoked.set(&addr, false);
        self.env().emit_event(HolderReinstatedEvent { holder: addr });
    }

    pub fn is_revoked(&self, addr: Address) -> bool {
        self.revoked.get_or_default(&addr)
    }

    pub fn transfer(&mut self, recipient: Address, amount: U256) {
        let caller = self.env().caller();
        self.assert_can_transfer(&caller, &recipient);
        self.token.transfer(&recipient, &amount);
    }

    pub fn transfer_from(&mut self, owner: Address, recipient: Address, amount: U256) {
        self.assert_can_transfer(&owner, &recipient);
        self.token.transfer_from(&owner, &recipient, &amount);
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

    delegate! {
        to self.token {
            fn name(&self) -> String;
            fn symbol(&self) -> String;
            fn decimals(&self) -> u8;
            fn total_supply(&self) -> U256;
            fn balance_of(&self, address: &Address) -> U256;
            fn allowance(&self, owner: &Address, spender: &Address) -> U256;
            fn approve(&mut self, spender: &Address, amount: &U256);
            fn decrease_allowance(&mut self, spender: &Address, decr_by: &U256);
            fn increase_allowance(&mut self, spender: &Address, inc_by: &U256);
        }
    }
}

impl MeridianToken {
    fn assert_can_transfer(&self, sender: &Address, recipient: &Address) {
        if self.revoked.get_or_default(sender) || self.revoked.get_or_default(recipient) {
            self.env().revert(Error::HolderRevoked);
        }
        let registry = self
            .compliance_registry
            .get()
            .flatten()
            .unwrap_or_revert_with(&self.env(), Error::ComplianceRegistryNotSet);
        let registry_ref = ComplianceRegistryContractRef::new(self.env(), registry);
        if !registry_ref.is_compliant(*sender) || !registry_ref.is_compliant(*recipient) {
            self.env().revert(Error::NotCompliant);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use meridian_types::TIMELOCK_DURATION_MS;
    use crate::test_helpers::{deploy_token_system, sample_attestation};
    use odra::casper_types::U256;

    #[test]
    fn token_init_and_balances() {
        let env = odra_test::env();
        let (_, token) = deploy_token_system(&env);
        let deployer = env.get_account(0);
        assert_eq!(token.balance_of(&deployer), U256::from(1_000_000u64));
    }

    #[test]
    fn transfer_between_compliant_holders() {
        let env = odra_test::env();
        let (mut registry, mut token) = deploy_token_system(&env);
        let a = env.get_account(1);
        let b = env.get_account(2);
        registry.register_holder(a, sample_attestation(&env));
        registry.register_holder(b, sample_attestation(&env));
        env.set_caller(env.get_account(0));
        token.transfer(a, U256::from(100u64));
        env.set_caller(a);
        token.transfer(b, U256::from(50u64));
        assert_eq!(token.balance_of(&b), U256::from(50u64));
    }

    #[test]
    fn revoked_holder_cannot_transfer() {
        let env = odra_test::env();
        let (mut registry, mut token) = deploy_token_system(&env);
        let deployer = env.get_account(0);
        let holder = env.get_account(1);
        let recipient = env.get_account(2);
        registry.register_holder(holder, sample_attestation(&env));
        registry.register_holder(recipient, sample_attestation(&env));
        env.set_caller(deployer);
        token.transfer(holder, U256::from(100u64));

        registry.set_compliance_officer(env.get_account(3));
        env.advance_block_time(TIMELOCK_DURATION_MS);
        registry.execute_compliance_officer();
        env.set_caller(env.get_account(3));
        registry.revoke(holder, "test".to_string());

        env.set_caller(holder);
        assert!(token.try_transfer(recipient, U256::from(1u64)).is_err());
    }

    #[test]
    fn accrue_yield_staking_vault_only() {
        let env = odra_test::env();
        let (_, mut token) = deploy_token_system(&env);
        let holder = env.get_account(1);
        env.set_caller(holder);
        assert!(token.try_accrue_yield(holder, U256::from(10u64)).is_err());
    }

    #[test]
    fn upgrade_requires_timelock() {
        let env = odra_test::env();
        let (_, mut token) = deploy_token_system(&env);
        assert!(token.try_execute_upgrade().is_err());
        token.schedule_upgrade();
        assert!(token.try_execute_upgrade().is_err());
        env.advance_block_time(TIMELOCK_DURATION_MS);
        token.execute_upgrade();
        assert!(env.emitted_event(
            &token,
            ContractUpgraded {
                upgraded_at: env.block_time(),
            }
        ));
    }

    #[test]
    fn event_token_issued() {
        let env = odra_test::env();
        let (_, token) = deploy_token_system(&env);
        assert!(env.emitted_event(
            &token,
            TokenIssued {
                issuer: env.get_account(0),
                total_supply: U256::from(1_000_000u64),
            }
        ));
    }
}
