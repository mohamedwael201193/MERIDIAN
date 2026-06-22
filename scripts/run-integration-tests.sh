#!/usr/bin/env bash
# Run MERIDIAN integration tests against Casper testnet.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ -f "$ROOT/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT/.env"
  set +a
fi

export ODRA_CASPER_LIVENET_SECRET_KEY_PATH="${ODRA_CASPER_LIVENET_SECRET_KEY_PATH:-$MERIDIAN_DEPLOYER_PRIVATE_KEY_PEM}"

PROXY_PID=""
if ! curl -sf "http://127.0.0.1:${CSPR_RPC_PROXY_PORT:-18777}/rpc" -H "Content-Type: application/json" -d '{"id":1,"jsonrpc":"2.0","method":"info_get_status","params":[]}' >/dev/null 2>&1; then
  node "$ROOT/scripts/cspr-rpc-proxy.mjs" &
  PROXY_PID=$!
  sleep 2
fi
trap '[ -n "$PROXY_PID" ] && kill "$PROXY_PID" 2>/dev/null || true' EXIT

export ODRA_CASPER_LIVENET_NODE_ADDRESS="${ODRA_CASPER_LIVENET_NODE_ADDRESS:-http://127.0.0.1:${CSPR_RPC_PROXY_PORT:-18777}}"
export ODRA_CASPER_LIVENET_CHAIN_NAME="${ODRA_CASPER_LIVENET_CHAIN_NAME:-casper-test}"
export ODRA_CASPER_LIVENET_EVENTS_URL="${ODRA_CASPER_LIVENET_EVENTS_URL:-http://127.0.0.1:${CSPR_EVENTS_PROXY_PORT:-18778}/}"
export CSPR_CLOUD_AUTH_TOKEN="${CSPR_CLOUD_AUTH_TOKEN:-$CASPER_API_KEY}"

export MERIDIAN_DEPLOYED_CONTRACTS_TOML="$ROOT/deployed/casper-test-contracts.toml"
ln -sfn "$ROOT/contracts/wasm" "$ROOT/tests/integration/wasm"

(cd "$ROOT/tests/integration" && cargo test -- --nocapture)