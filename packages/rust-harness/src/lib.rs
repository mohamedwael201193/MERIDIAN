//! MERIDIAN Rust workspace harness.
//! Exists only to validate fmt/clippy/test infrastructure in Phase 1.

/// Returns the workspace harness version marker.
#[must_use]
pub fn harness_version() -> &'static str {
    "phase-1"
}

#[cfg(test)]
mod tests {
    use super::harness_version;

    #[test]
    fn harness_version_is_set() {
        assert_eq!(harness_version(), "phase-1");
    }
}
