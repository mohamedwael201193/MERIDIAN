# MERIDIAN justfile — cloud-first (no Docker)

set shell := ["bash", "-cu"]

default:
    @just --list

bootstrap:
    ./scripts/bootstrap.sh

verify-env:
    ./scripts/verify-env.sh

verify-phase1:
    node scripts/verify-phase1.mjs

fmt:
    cargo fmt --all
    pnpm format

fmt-check:
    cargo fmt --all -- --check
    pnpm format:check

lint:
    cargo clippy --workspace -- -D warnings
    pnpm lint

test:
    cargo test --workspace
    pnpm test

ci:
    just fmt-check
    just lint
    just test

toolchain:
    @echo "=== Toolchain ==="
    @rustc --version
    @cargo --version
    @cargo odra --version
    @casper-client --version
    @node --version
    @pnpm --version

phase1:
    bash scripts/verify-all.sh
