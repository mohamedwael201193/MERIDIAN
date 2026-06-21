#!/usr/bin/env bash
# Full Phase 1 gate — all checks must pass before Phase 2.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

step() {
  echo ""
  echo -e "${GREEN}=== $1 ===${NC}"
}

failures=0

run() {
  if "$@"; then
    return 0
  fi
  failures=$((failures + 1))
  return 1
}

step "Environment variables"
run bash scripts/verify-env.sh

step "Cloud connectivity + toolchain"
run node scripts/verify-phase1.mjs

step "Rust fmt"
run cargo fmt --all -- --check

step "Rust clippy"
run cargo clippy --workspace -- -D warnings

step "Rust test"
run cargo test --workspace

step "Prettier"
run pnpm format:check

step "ESLint"
run pnpm lint

step "TypeScript"
run pnpm typecheck

step "Vitest"
run pnpm test:ci

echo ""
if [[ "$failures" -gt 0 ]]; then
  echo -e "${RED}VERIFY-ALL FAILED${NC} — $failures step(s) failed"
  exit 1
fi

echo -e "${GREEN}VERIFY-ALL PASSED${NC} — Phase 1 is 100% green; ready for Phase 2 approval"
