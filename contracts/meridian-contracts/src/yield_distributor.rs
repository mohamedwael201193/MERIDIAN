use crate::compliance_registry::ComplianceRegistryContractRef;
use crate::meridian_token::MeridianTokenContractRef;
use crate::timelock::{assert_elapsed, schedule_at, TimelockError};
use meridian_types::PendingU32Change;
use odra::casper_types::U512;
use odra::prelude::*;
use odra::ContractRef;
use odra::uints::ToU512;
use odra_modules::access::Ownable;

/// YieldDistributor errors.
#[odra::odra_error]
pub enum Error {
    NotStakingVault = 33_000,
    ZeroRewards = 33_001,
    ZeroSupply = 33_002,
    Overflow = 33_003,
    InvalidFeeBps = 33_004,
    NothingScheduled = 33_005,
    AlreadyRegistered = 33_006,
    VaultNotSet = 33_007,
    TokenNotSet = 33_008,
    TreasuryNotSet = 33_009,
    RegistryNotSet = 33_010,
}

#[odra::event]
pub struct DistributorInitialized {
    pub token: Address,
    pub vault: Address,
    pub treasury: Address,
}

#[odra::event]
pub struct YieldDistributed {
    pub holder: Address,
    pub amount: U512,
}

#[odra::event]
pub struct HolderRegisteredForYield {
    pub holder: Address,
}

#[odra::event]
pub struct ProtocolFeeChanged {
    pub bps: u32,
}

#[odra::event]
pub struct ProtocolFeeScheduled {
    pub bps: u32,
    pub executable_at: u64,
}

#[odra::event]
pub struct ContractUpgraded {
    pub upgraded_at: u64,
}

#[odra::module(
    events = [
        DistributorInitialized,
        YieldDistributed,
        HolderRegisteredForYield,
        ProtocolFeeChanged,
        ProtocolFeeScheduled,
        ContractUpgraded,
    ],
    errors = Error
)]
pub struct YieldDistributor {
    ownable: SubModule<Ownable>,
    token: Var<Address>,
    vault: Var<Address>,
    treasury: Var<Address>,
    compliance_registry: Var<Address>,
    protocol_fee_bps: Var<u32>,
    pending_fee: Var<Option<PendingU32Change>>,
    pending_yield: Mapping<Address, U512>,
    holders: List<Address>,
    is_holder: Mapping<Address, bool>,
    pending_upgrade_at: Var<Option<u64>>,
}

#[odra::module]
impl YieldDistributor {
    pub fn init(
        &mut self,
        token: Address,
        vault: Address,
        treasury: Address,
        compliance_registry: Address,
    ) {
        let caller = self.env().caller();
        self.ownable.init(caller);
        self.token.set(token);
        self.vault.set(vault);
        self.treasury.set(treasury);
        self.compliance_registry.set(compliance_registry);
        self.protocol_fee_bps.set(250);
        self.env().emit_event(DistributorInitialized {
            token,
            vault,
            treasury,
        });
    }

    pub fn register_holder(&mut self, holder: Address) {
        if self.env().caller()
            != self
                .vault
                .get()
                .unwrap_or_revert_with(&self.env(), Error::VaultNotSet)
        {
            self.env().revert(Error::NotStakingVault);
        }
        if self.is_holder.get_or_default(&holder) {
            self.env().revert(Error::AlreadyRegistered);
        }
        self.is_holder.set(&holder, true);
        self.holders.push(holder);
        self.env().emit_event(HolderRegisteredForYield { holder });
    }

    #[odra(payable)]
    pub fn distribute(&mut self, rewards: U512) {
        if self.env().caller()
            != self
                .vault
                .get()
                .unwrap_or_revert_with(&self.env(), Error::VaultNotSet)
        {
            self.env().revert(Error::NotStakingVault);
        }
        if rewards.is_zero() {
            self.env().revert(Error::ZeroRewards);
        }

        let fee_bps = self.protocol_fee_bps.get_or_default();
        let protocol_fee = rewards
            .checked_mul(U512::from(u64::from(fee_bps)))
            .and_then(|v| v.checked_div(U512::from(10_000u64)))
            .unwrap_or_revert_with(&self.env(), Error::Overflow);
        let distributable = rewards
            .checked_sub(protocol_fee)
            .unwrap_or_revert_with(&self.env(), Error::Overflow);

        if !protocol_fee.is_zero() {
            self.env().transfer_tokens(
                &self
                    .treasury
                    .get()
                    .unwrap_or_revert_with(&self.env(), Error::TreasuryNotSet),
                &protocol_fee,
            );
        }

        let token_ref = MeridianTokenContractRef::new(
            self.env(),
            self.token
                .get()
                .unwrap_or_revert_with(&self.env(), Error::TokenNotSet),
        );
        let registry_ref = ComplianceRegistryContractRef::new(
            self.env(),
            self.compliance_registry
                .get()
                .unwrap_or_revert_with(&self.env(), Error::RegistryNotSet),
        );
        let total_supply = token_ref.total_supply();
        if total_supply.is_zero() {
            self.env().revert(Error::ZeroSupply);
        }
        let total_supply_u512 = total_supply.to_u512();

        let len = self.holders.len();
        for i in 0..len {
            let Some(holder) = self.holders.get(i) else {
                continue;
            };
            if !registry_ref.is_compliant(holder) {
                continue;
            }
            let balance = token_ref.balance_of(&holder);
            if balance.is_zero() {
                continue;
            }
            let balance_u512 = balance.to_u512();
            let share = distributable
                .checked_mul(balance_u512)
                .and_then(|v| v.checked_div(total_supply_u512))
                .unwrap_or_revert_with(&self.env(), Error::Overflow);
            if share.is_zero() {
                continue;
            }
            let pending = self
                .pending_yield
                .get(&holder)
                .unwrap_or_default()
                .checked_add(share)
                .unwrap_or_revert_with(&self.env(), Error::Overflow);
            self.pending_yield.set(&holder, pending);
            self.env()
                .transfer_tokens(&holder, &share);
            self.env().emit_event(YieldDistributed { holder, amount: share });
        }
    }

    pub fn pending_yield(&self, holder: Address) -> U512 {
        self.pending_yield.get(&holder).unwrap_or_default()
    }

    pub fn get_protocol_fee_bps(&self) -> u32 {
        self.protocol_fee_bps.get_or_default()
    }

    pub fn set_protocol_fee_bps(&mut self, bps: u32) {
        self.ownable.assert_owner(&self.env().caller());
        if bps > 10_000 {
            self.env().revert(Error::InvalidFeeBps);
        }
        let executable_at = schedule_at(&self.env());
        self.pending_fee.set(Some(PendingU32Change {
            value: bps,
            executable_at,
        }));
        self.env().emit_event(ProtocolFeeScheduled { bps, executable_at });
    }

    pub fn execute_protocol_fee_bps(&mut self) {
        self.ownable.assert_owner(&self.env().caller());
        let pending = self
            .pending_fee
            .get()
            .flatten()
            .unwrap_or_revert_with(&self.env(), Error::NothingScheduled);
        assert_elapsed(&self.env(), pending.executable_at);
        self.protocol_fee_bps.set(pending.value);
        self.pending_fee.set(None);
        self.env().emit_event(ProtocolFeeChanged {
            bps: pending.value,
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
    use crate::test_helpers::deploy_stack_with_deposit;
    use odra::host::HostRef;

    #[test]
    fn distribute_pro_rata_to_compliant_holder() {
        let env = odra_test::env();
        let (_, _, vault, distributor) = deploy_stack_with_deposit(&env);
        let holder = env.get_account(1);
        let rewards = U512::from(10_000u64);
        env.set_caller(env.get_account(0));
        vault.with_tokens(rewards).forward_distribute(rewards);
        assert!(distributor.pending_yield(holder) > U512::zero());
    }

    #[test]
    fn distribute_vault_only() {
        let env = odra_test::env();
        let (_, _, _, mut distributor) = deploy_stack_with_deposit(&env);
        env.set_caller(env.get_account(5));
        assert!(distributor
            .try_distribute(U512::from(100u64))
            .is_err());
    }

    #[test]
    fn protocol_fee_timelock() {
        let env = odra_test::env();
        let (_, _, _, mut distributor) = deploy_stack_with_deposit(&env);
        env.set_caller(env.get_account(0));
        distributor.set_protocol_fee_bps(500);
        assert!(distributor.try_execute_protocol_fee_bps().is_err());
        env.advance_block_time(TIMELOCK_DURATION_MS);
        distributor.execute_protocol_fee_bps();
        assert_eq!(distributor.get_protocol_fee_bps(), 500);
    }

    #[test]
    fn overflow_safe_distribution() {
        let env = odra_test::env();
        let (_, _, vault, distributor) = deploy_stack_with_deposit(&env);
        let rewards = U512::from(1u64);
        env.set_caller(env.get_account(0));
        vault.with_tokens(rewards).forward_distribute(rewards);
        assert!(distributor.pending_yield(env.get_account(1)) > U512::zero());
    }
}
