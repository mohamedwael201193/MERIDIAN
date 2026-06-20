//! Testnet validator selection without unauthenticated auction RPC (CSPR.cloud requires auth).

use odra::casper_types::{AsymmetricType, PublicKey};

/// Default Casper testnet validator (era weight leader at block ~8332929).
pub const DEFAULT_TESTNET_VALIDATOR: &str =
    "010615d378f2a3c98b34707722413a43ce72dbbfcc6e6e05a19661bcb8ee67bc40";

pub fn testnet_validator() -> PublicKey {
    let hex = std::env::var("MERIDIAN_VALIDATOR_PUBLIC_KEY")
        .unwrap_or_else(|_| DEFAULT_TESTNET_VALIDATOR.to_string());
    PublicKey::from_hex(&hex).expect("MERIDIAN_VALIDATOR_PUBLIC_KEY must be valid hex")
}
