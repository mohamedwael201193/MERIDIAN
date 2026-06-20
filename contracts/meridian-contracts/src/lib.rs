#![cfg_attr(not(test), no_std)]
#![cfg_attr(not(test), no_main)]
extern crate alloc;

pub mod compliance_registry;
pub mod meridian_audit;
pub mod meridian_token;
pub mod staking_vault;
pub mod timelock;
pub mod yield_distributor;

#[cfg(test)]
mod test_helpers;
