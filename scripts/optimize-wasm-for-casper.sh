#!/usr/bin/env bash
# Lower LLVM 20 bulk-memory ops for Casper VM (requires wasm-opt from binaryen).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WASM_DIR="$ROOT/contracts/wasm"
MODULE_WASM="$ROOT/contracts/meridian-contracts/wasm"

if ! command -v wasm-opt >/dev/null 2>&1; then
  echo "wasm-opt not found — install binaryen (apt) or: npm install -g binaryen"
  exit 1
fi

for wasm in "$WASM_DIR"/*.wasm; do
  name="$(basename "$wasm")"
  echo "Optimizing $name for Casper..."
  wasm-opt --signext-lowering --llvm-memory-copy-fill-lowering --disable-bulk-memory -Oz \
    "$wasm" -o "$wasm"
  if command -v wasm-strip >/dev/null 2>&1; then
    wasm-strip "$wasm"
  fi
  if [[ -d "$MODULE_WASM" ]]; then
    cp "$wasm" "$MODULE_WASM/$name"
  fi
done

echo "WASM Casper optimization complete."
