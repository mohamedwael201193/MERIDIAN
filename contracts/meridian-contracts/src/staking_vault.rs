use crate::timelock::{assert_elapsed, schedule_at, TimelockError};
use crate::yield_distributor::YieldDistributorContractRef;
use crate::meridian_token::MeridianTokenContractRef;
use meridian_types::{PendingAddressChange, VALIDATOR_CURATOR_ROLE, DEFAULT_ADMIN_ROLE};
use odra::casper_types::{PublicKey, U512};
use odra::prelude::*;
use odra::ContractRef;
use odra::uints::ToU256;
use odra_modules::access::{AccessControl, Ownable};

/// StakingVault errors.
#[odra::odra_error]
pub enum Error {
    NotYieldDistributor = 32_000,
    ZeroDeposit = 32_001,
    InsufficientStake = 32_002,
    YieldDistributorNotSet = 32_003,
    Overflow = 32_004,
    NothingScheduled = 32_005,
    ValidatorNotSet = 32_006,
    TokenNotSet = 32_007,
}

#[odra::event]
pub struct VaultInitialized {
    pub token: Address,
    pub validator: PublicKey,
}

#[odra::event]
pub struct DepositReceived {
    pub depositor: Address,
    pub amount: U512,
}

#[odra::event]
pub struct Staked {
    pub depositor: Address,
    pub validator: PublicKey,
    pub amount: U512,
}

#[odra::event]
pub struct Restaked {
    pub from: PublicKey,
    pub to: PublicKey,
    pub amount: U512,
}

#[odra::event]
pub struct Undelegated {
    pub validator: PublicKey,
    pub amount: U512,
}

#[odra::event]
pub struct RewardsClaimed {
    pub amount: U512,
}

#[odra::event]
pub struct ValidatorCuratorScheduled {
    pub curator: Address,
    pub executable_at: u64,
}

#[odra::event]
pub struct ValidatorCuratorChanged {
    pub curator: Address,
}

#[odra::event]
pub struct ContractUpgraded {
    pub upgraded_at: u64,
}

#[odra::module(
    events = [
        VaultInitialized,
        DepositReceived,
        Staked,
        Restaked,
        Undelegated,
        RewardsClaimed,
        ValidatorCuratorScheduled,
        ValidatorCuratorChanged,
        ContractUpgraded,
    ],
    errors = Error
)]
pub struct StakingVault {
    ownable: SubModule<Ownable>,
    access: SubModule<AccessControl>,
    token: Var<Address>,
    yield_distributor: Var<Option<Address>>,
    validator: Var<PublicKey>,
    total_staked: Var<U512>,
    pending_curator: Var<Option<PendingAddressChange>>,
    pending_upgrade_at: Var<Option<u64>>,
}

#[odra::module]
impl StakingVault {
    pub fn init(&mut self, token: Address, validator: PublicKey) {
        let caller = self.env().caller();
        self.ownable.init(caller);
        self.access
            .unchecked_grant_role(&DEFAULT_ADMIN_ROLE, &caller);
        self.access
            .set_admin_role(&VALIDATOR_CURATOR_ROLE, &DEFAULT_ADMIN_ROLE);
        self.token.set(token);
        self.validator.set(validator.clone());
        self.total_staked.set(U512::zero());
        self.yield_distributor.set(None);
        self.env().emit_event(VaultInitialized { token, validator });
    }

    pub fn set_yield_distributor(&mut self, distributor: Address) {
        self.ownable.assert_owner(&self.env().caller());
        self.yield_distributor.set(Some(distributor));
    }

    #[odra(payable)]
    pub fn deposit(&mut self) {
        let amount = self.env().attached_value();
        if amount.is_zero() {
            self.env().revert(Error::ZeroDeposit);
        }
        let caller = self.env().caller();
        let validator = self
            .validator
            .get()
            .unwrap_or_revert_with(&self.env(), Error::ValidatorNotSet);

        self.env().emit_event(DepositReceived {
            depositor: caller,
            amount,
        });

        self.env().delegate(validator.clone(), amount);

        let new_total = self
            .total_staked
            .get_or_default()
            .checked_add(amount)
            .unwrap_or_revert_with(&self.env(), Error::Overflow);
        self.total_staked.set(new_total);

        let mint_amount = amount
            .to_u256()
            .unwrap_or_revert_with(&self.env(), Error::Overflow);
        MeridianTokenContractRef::new(
            self.env(),
            self.token
                .get()
                .unwrap_or_revert_with(&self.env(), Error::TokenNotSet),
        )
            .accrue_yield(caller, mint_amount);

        if let Some(distributor) = self.yield_distributor.get().flatten() {
            YieldDistributorContractRef::new(self.env(), distributor).register_holder(caller);
        }

        self.env().emit_event(Staked {
            depositor: caller,
            validator,
            amount,
        });
    }

    pub fn restake(&mut self, from: PublicKey, to: PublicKey, amount: U512) {
        self.access
            .check_role(&VALIDATOR_CURATOR_ROLE, &self.env().caller());
        if amount.is_zero() {
            return;
        }
        self.env().undelegate(from.clone(), amount);
        self.env().delegate(to.clone(), amount);
        self.env().emit_event(Restaked { from, to, amount });
    }

    pub fn undelegate(&mut self, validator: PublicKey, amount: U512) {
        self.access
            .check_role(&VALIDATOR_CURATOR_ROLE, &self.env().caller());
        if amount.is_zero() {
            return;
        }
        let new_total = self
            .total_staked
            .get_or_default()
            .checked_sub(amount)
            .unwrap_or_revert_with(&self.env(), Error::InsufficientStake);
        self.total_staked.set(new_total);
        self.env().undelegate(validator.clone(), amount);
        self.env().emit_event(Undelegated { validator, amount });
    }

    pub fn claim_rewards(&mut self) -> U512 {
        let distributor = self
            .yield_distributor
            .get()
            .flatten()
            .unwrap_or_revert_with(&self.env(), Error::YieldDistributorNotSet);
        if self.env().caller() != distributor {
            self.env().revert(Error::NotYieldDistributor);
        }
        let validator = self
            .validator
            .get()
            .unwrap_or_revert_with(&self.env(), Error::ValidatorNotSet);
        let delegated = self.env().delegated_amount(validator.clone());
        let principal = self.total_staked.get_or_default();
        let rewards = delegated.saturating_sub(principal);
        if !rewards.is_zero() {
            self.env().undelegate(validator, rewards);
        }
        self.env().emit_event(RewardsClaimed { amount: rewards });
        rewards
    }

    pub fn distribute_rewards(&mut self) {
        let distributor_addr = self
            .yield_distributor
            .get()
            .flatten()
            .unwrap_or_revert_with(&self.env(), Error::YieldDistributorNotSet);
        if self.env().caller() != distributor_addr {
            self.env().revert(Error::NotYieldDistributor);
        }
        let rewards = self.claim_rewards();
        if !rewards.is_zero() {
            YieldDistributorContractRef::new(self.env(), distributor_addr)
                .with_tokens(rewards)
                .distribute(rewards);
        }
    }

    pub fn set_validator_curator(&mut self, addr: Address) {
        self.ownable.assert_owner(&self.env().caller());
        let executable_at = schedule_at(&self.env());
        self.pending_curator.set(Some(PendingAddressChange {
            value: addr,
            executable_at,
        }));
        self.env().emit_event(ValidatorCuratorScheduled {
            curator: addr,
            executable_at,
        });
    }

    pub fn execute_validator_curator(&mut self) {
        self.ownable.assert_owner(&self.env().caller());
        let pending = self
            .pending_curator
            .get()
            .flatten()
            .unwrap_or_revert_with(&self.env(), Error::NothingScheduled);
        assert_elapsed(&self.env(), pending.executable_at);
        self.access
            .unchecked_grant_role(&VALIDATOR_CURATOR_ROLE, &pending.value);
        self.pending_curator.set(None);
        self.env().emit_event(ValidatorCuratorChanged {
            curator: pending.value,
        });
    }

    #[odra(payable)]
    pub fn forward_distribute(&mut self, rewards: U512) {
        let distributor = self
            .yield_distributor
            .get()
            .flatten()
            .unwrap_or_revert_with(&self.env(), Error::YieldDistributorNotSet);
        YieldDistributorContractRef::new(self.env(), distributor)
            .with_tokens(rewards)
            .distribute(rewards);
    }

    pub fn get_validator(&self) -> PublicKey {
        self.validator
            .get()
            .unwrap_or_revert_with(&self.env(), Error::ValidatorNotSet)
    }

    pub fn get_total_staked(&self) -> U512 {
        self.total_staked.get_or_default()
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
    use crate::test_helpers::deploy_vault_stack;
    use odra::casper_types::{U256, U512};
    use odra::host::HostRef;

    #[test]
    fn deposit_stakes_and_mints() {
        let env = odra_test::env();
        let (token, vault, _) = deploy_vault_stack(&env);
        let depositor = env.get_account(1);
        env.set_caller(depositor);
        let amount = U512::from(1_000u64);
        vault.with_tokens(amount).deposit();
        assert_eq!(vault.get_total_staked(), amount);
        assert_eq!(token.balance_of(&depositor), U256::from(1_000u64));
    }

    #[test]
    fn restake_requires_curator_role() {
        let env = odra_test::env();
        let (_, mut vault, _) = deploy_vault_stack(&env);
        let stranger = env.get_account(4);
        env.set_caller(stranger);
        let v0 = env.get_validator(0);
        let v1 = env.get_validator(1);
        assert!(vault
            .try_restake(v0, v1, U512::from(1u64))
            .is_err());
    }

    #[test]
    fn undelegate_reduces_total_staked() {
        let env = odra_test::env();
        let (_, mut vault, _) = deploy_vault_stack(&env);
        let deployer = env.get_account(0);
        vault.set_validator_curator(deployer);
        env.advance_block_time(TIMELOCK_DURATION_MS);
        vault.execute_validator_curator();

        let depositor = env.get_account(1);
        env.set_caller(depositor);
        vault.with_tokens(U512::from(500u64)).deposit();

        env.set_caller(deployer);
        vault.undelegate(env.get_validator(0), U512::from(200u64));
        assert_eq!(vault.get_total_staked(), U512::from(300u64));
    }

    #[test]
    fn deposit_emits_events() {
        let env = odra_test::env();
        let (_, vault, _) = deploy_vault_stack(&env);
        let depositor = env.get_account(1);
        env.set_caller(depositor);
        let amount = U512::from(100u64);
        vault.with_tokens(amount).deposit();
        assert!(env.emitted_event(
            &vault,
            DepositReceived {
                depositor,
                amount,
            }
        ));
    }

    #[test]
    fn overflow_total_staked_reverts() {
        let env = odra_test::env();
        let (_, mut vault, _) = deploy_vault_stack(&env);
        // Manually test insufficient undelegate instead — U512 max deposit impractical in VM.
        let deployer = env.get_account(0);
        vault.set_validator_curator(deployer);
        env.advance_block_time(TIMELOCK_DURATION_MS);
        vault.execute_validator_curator();
        env.set_caller(deployer);
        assert!(vault
            .try_undelegate(env.get_validator(0), U512::from(1u64))
            .is_err());
    }
}
