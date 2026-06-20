use meridian_types::TIMELOCK_DURATION_MS;
use odra::prelude::*;

/// Returns block time + 24h timelock, reverting on overflow.
pub fn schedule_at(env: &ContractEnv) -> u64 {
    env.get_block_time()
        .checked_add(TIMELOCK_DURATION_MS)
        .unwrap_or_revert_with(env, TimelockError::Overflow)
}

/// Reverts if the timelock has not elapsed.
pub fn assert_elapsed(env: &ContractEnv, executable_at: u64) {
    if env.get_block_time() < executable_at {
        env.revert(TimelockError::NotElapsed);
    }
}

/// Shared timelock errors.
#[odra::odra_error]
pub enum TimelockError {
    NotElapsed = 10_000,
    Overflow = 10_001,
    NothingScheduled = 10_002,
}
