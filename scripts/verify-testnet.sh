#!/usr/bin/env bash
# Verify deployed MERIDIAN contracts on testnet.
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
export ODRA_CASPER_LIVENET_EVENTS_URL="${ODRA_CASPER_LIVENET_EVENTS_URL:-http://127.0.0.1:${CSPR_EVENTS_PROXY_PORT:-18778}/}"
export ODRA_CASPER_LIVENET_CHAIN_NAME="${ODRA_CASPER_LIVENET_CHAIN_NAME:-casper-test}"
export CSPR_CLOUD_AUTH_TOKEN="${CSPR_CLOUD_AUTH_TOKEN:-$CASPER_API_KEY}"

ADDRESSES="$ROOT/deployed/addresses.json"
if [[ ! -f "$ADDRESSES" ]]; then
  echo "Missing $ADDRESSES — run scripts/deploy-testnet.sh first" >&2
  exit 1
fi

echo "CLI status:"
(cd "$ROOT/contracts" && cargo run --bin meridian_contracts_cli -- status)

echo "On-chain package hashes:"
node -e "
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('$ADDRESSES','utf8'));
for (const [name, info] of Object.entries(data.contracts || {})) {
  console.log(name + ': ' + (info.package_hash || info.contract_hash));
  if (info.explorer_url) console.log('  ' + info.explorer_url);
}
"

echo "Verify complete."
