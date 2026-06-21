#!/usr/bin/env bash
# Install MERIDIAN development dependencies (no Docker/local DB)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "=== MERIDIAN bootstrap ==="

if ! command -v rustc >/dev/null 2>&1; then
  echo "FAIL: Rust not installed. Install from https://rustup.rs"
  exit 1
fi

rustup default stable
rustup target add wasm32-unknown-unknown

if ! cargo odra --version >/dev/null 2>&1; then
  echo "Installing cargo-odra 0.1.7..."
  cargo install cargo-odra --version 0.1.7 --locked
fi

if ! casper-client --version >/dev/null 2>&1; then
  echo "Installing casper-client 5.0.1..."
  cargo install casper-client --version 5.0.1 --locked
fi

if ! command -v pnpm >/dev/null 2>&1; then
  echo "Installing pnpm..."
  npm install -g pnpm@10.28.0
fi

pnpm install

echo "=== bootstrap complete ==="
