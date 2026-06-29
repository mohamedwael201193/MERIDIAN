#!/usr/bin/env bash
# Deploy MERIDIAN to Render — sync blueprint and upload env vars from local .env (never committed).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ -f "$ROOT/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT/.env"
  set +a
fi

RENDER_KEY="${RENDER_API_KEY:-${rebder_api_key:-}}"
if [[ -z "$RENDER_KEY" ]]; then
  echo "RENDER_API_KEY not set in .env"
  exit 1
fi

AUTH="Authorization: Bearer $RENDER_KEY"
REPO="https://github.com/mohamedwael201193/MERIDIAN"

echo "==> Fetching Render owner..."
OWNER_ID=$(curl -sS -H "$AUTH" https://api.render.com/v1/owners | node -e "
let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{
  const j=JSON.parse(d); const o=(Array.isArray(j)?j[0]:j);
  console.log(o?.owner?.id||o?.id||'');
})")
echo "Owner: $OWNER_ID"

# Inline deployer PEM for x402 facilitator on Render
DEPLOYER_PEM=""
PEM_PATH="${MERIDIAN_DEPLOYER_PRIVATE_KEY_PEM:-${ODRA_CASPER_LIVENET_SECRET_KEY_PATH:-}}"
if [[ -n "$PEM_PATH" && -f "$PEM_PATH" ]]; then
  DEPLOYER_PEM=$(cat "$PEM_PATH")
fi

echo "==> Syncing blueprint from render.yaml..."
SYNC_RESP=$(curl -sS -X POST -H "$AUTH" -H "Content-Type: application/json" \
  -d "{\"repo\":\"$REPO\",\"branch\":\"main\",\"name\":\"meridian\"}" \
  "https://api.render.com/v1/blueprints/sync" 2>&1) || true
echo "$SYNC_RESP" | head -c 800
echo ""

echo "==> Waiting for services..."
sleep 15

SERVICES_JSON=$(curl -sS -H "$AUTH" "https://api.render.com/v1/services?limit=50")

export SERVICES_JSON DEPLOYER_PEM BACKEND_URL X402_FACILITATOR_URL MERIDIAN_API_KEY
node <<'NODE'
const services = JSON.parse(process.env.SERVICES_JSON || '[]');
const byName = {};
for (const row of services) {
  const s = row.service || row;
  if (s.name?.startsWith('meridian')) byName[s.name] = s;
}
console.log(JSON.stringify(Object.fromEntries(
  Object.entries(byName).map(([n, s]) => [n, { id: s.id, url: s.serviceDetails?.url || s.url || null }])
), null, 2));
NODE

set_env() {
  local SERVICE_ID="$1"
  local KEY="$2"
  local VAL="$3"
  [[ -z "$VAL" ]] && return 0
  local PAYLOAD
  PAYLOAD=$(node -e "process.stdout.write(JSON.stringify({envVarKey:process.argv[1],value:process.argv[2]}))" "$KEY" "$VAL")
  curl -sS -X POST -H "$AUTH" -H "Content-Type: application/json" \
    -d "$PAYLOAD" \
    "https://api.render.com/v1/services/$SERVICE_ID/env-vars" >/dev/null
}

upload_service_env() {
  local SERVICE_ID="$1"
  shift
  while [[ $# -ge 2 ]]; do
    set_env "$SERVICE_ID" "$1" "$2"
    shift 2
  done
}

get_service_id() {
  echo "$SERVICES_JSON" | node -e "
    let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{
      const j=JSON.parse(d); const name=process.argv[1];
      for (const row of j) {
        const s=row.service||row;
        if (s.name===name) { console.log(s.id); return; }
      }
    });
  " "$1"
}

BACKEND_ID=$(get_service_id meridian-backend)
AGENTS_ID=$(get_service_id meridian-agents)
X402_ID=$(get_service_id meridian-x402-facilitator)
RESOURCE_ID=$(get_service_id meridian-x402-resource)
MCP_ID=$(get_service_id meridian-mcp-server)

BACKEND_URL_LIVE=""
X402_URL_LIVE=""
RESOURCE_URL_LIVE=""
MCP_URL_LIVE=""

if [[ -n "$BACKEND_ID" ]]; then
  BACKEND_URL_LIVE=$(curl -sS -H "$AUTH" "https://api.render.com/v1/services/$BACKEND_ID" | node -e "
    let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{
      const s=JSON.parse(d); console.log(s.serviceDetails?.url||s.url||'');
    })")
fi
if [[ -n "$X402_ID" ]]; then
  X402_URL_LIVE=$(curl -sS -H "$AUTH" "https://api.render.com/v1/services/$X402_ID" | node -e "
    let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{
      const s=JSON.parse(d); console.log(s.serviceDetails?.url||s.url||'');
    })")
fi
if [[ -n "$RESOURCE_ID" ]]; then
  RESOURCE_URL_LIVE=$(curl -sS -H "$AUTH" "https://api.render.com/v1/services/$RESOURCE_ID" | node -e "
    let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{
      const s=JSON.parse(d); console.log(s.serviceDetails?.url||s.url||'');
    })")
fi
if [[ -n "$MCP_ID" ]]; then
  MCP_URL_LIVE=$(curl -sS -H "$AUTH" "https://api.render.com/v1/services/$MCP_ID" | node -e "
    let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{
      const s=JSON.parse(d); console.log(s.serviceDetails?.url||s.url||'');
    })")
fi

echo "Backend URL: $BACKEND_URL_LIVE"
echo "x402 URL: $X402_URL_LIVE"
echo "Resource URL: $RESOURCE_URL_LIVE"
echo "MCP URL: $MCP_URL_LIVE"

if [[ -n "$BACKEND_ID" ]]; then
  echo "==> Uploading env to meridian-backend..."
  upload_service_env "$BACKEND_ID" \
    NODE_ENV production \
    HOST 0.0.0.0 \
    DATABASE_URL "${DATABASE_URL:-}" \
    SUPABASE_URL "${SUPABASE_URL:-}" \
    SUPABASE_ANON_KEY "${SUPABASE_ANON_KEY:-}" \
    SUPABASE_SERVICE_ROLE_KEY "${SUPABASE_SERVICE_ROLE_KEY:-}" \
    UPSTASH_REDIS_REST_URL "${UPSTASH_REDIS_REST_URL:-}" \
    UPSTASH_REDIS_REST_TOKEN "${UPSTASH_REDIS_REST_TOKEN:-}" \
    CASPER_NETWORK "${CASPER_NETWORK:-casper-test}" \
    CASPER_RPC_URL "${CASPER_RPC_URL:-}" \
    CASPER_CHAIN_NAME "${CASPER_CHAIN_NAME:-casper-test}" \
    CASPER_API_KEY "${CASPER_API_KEY:-}" \
    CASPER_SIDE_CAR_URL "${CASPER_SIDE_CAR_URL:-}" \
    CSPR_STREAMING_URL "${CSPR_STREAMING_URL:-}" \
    CSPR_CLOUD_AUTH_TOKEN "${CSPR_CLOUD_AUTH_TOKEN:-}" \
    MERIDIAN_API_KEY "${MERIDIAN_API_KEY:-}" \
    MERIDIAN_CONTRACTS_PATH deployed/addresses.json \
    INDEXER_ENABLED true \
    INDEXER_BACKFILL_ON_START true \
    LOG_LEVEL "${LOG_LEVEL:-info}" \
    X402_FACILITATOR_URL "${X402_URL_LIVE:-${X402_FACILITATOR_URL:-}}"
fi

if [[ -n "$AGENTS_ID" ]]; then
  echo "==> Uploading env to meridian-agents..."
  upload_service_env "$AGENTS_ID" \
    NODE_ENV production \
    DATABASE_URL "${DATABASE_URL:-}" \
    UPSTASH_REDIS_REST_URL "${UPSTASH_REDIS_REST_URL:-}" \
    UPSTASH_REDIS_REST_TOKEN "${UPSTASH_REDIS_REST_TOKEN:-}" \
    OPENAI_API_KEY "${OPENAI_API_KEY:-}" \
    OPENAI_BASE_URL "${OPENAI_BASE_URL:-}" \
    OPENAI_MODEL "${OPENAI_MODEL:-}" \
    CEREBRAS_API_KEY "${CEREBRAS_API_KEY:-}" \
    SAMBANOVA_API_KEY "${SAMBANOVA_API_KEY:-}" \
    TOGETHER_API_KEY "${TOGETHER_API_KEY:-}" \
    OPENROUTER_API_KEY "${OPENROUTER_API_KEY:-}" \
    GROQ_API_KEY "${GROQ_API_KEY:-}" \
    GEMINI_API_KEY "${GEMINI_API_KEY:-}" \
    CASPER_RPC_URL "${CASPER_RPC_URL:-}" \
    CASPER_API_KEY "${CASPER_API_KEY:-}" \
    MERIDIAN_API_KEY "${MERIDIAN_API_KEY:-}" \
    BACKEND_URL "${BACKEND_URL_LIVE:-${BACKEND_URL:-}}"
fi

if [[ -n "$X402_ID" ]]; then
  echo "==> Uploading env to meridian-x402-facilitator..."
  upload_service_env "$X402_ID" \
    NODE_ENV production \
    X402_MODE facilitator \
    CASPER_RPC_URL "${CASPER_RPC_URL:-}" \
    CASPER_CHAIN_NAME "${CASPER_CHAIN_NAME:-casper-test}" \
    CASPER_API_KEY "${CASPER_API_KEY:-}" \
    UPSTASH_REDIS_REST_URL "${UPSTASH_REDIS_REST_URL:-}" \
    UPSTASH_REDIS_REST_TOKEN "${UPSTASH_REDIS_REST_TOKEN:-}" \
    X402_PAY_TO_ACCOUNT_HASH "${X402_PAY_TO_ACCOUNT_HASH:-}" \
    X402_PAYMENT_AMOUNT_MOTES "${X402_PAYMENT_AMOUNT_MOTES:-}" \
    MERIDIAN_DEPLOYER_PRIVATE_KEY_PEM "${DEPLOYER_PEM:-}"
fi

if [[ -n "$RESOURCE_ID" ]]; then
  echo "==> Uploading env to meridian-x402-resource..."
  upload_service_env "$RESOURCE_ID" \
    NODE_ENV production \
    X402_MODE resource \
    X402_FACILITATOR_URL "${X402_URL_LIVE:-${X402_FACILITATOR_URL:-}}" \
    BACKEND_URL "${BACKEND_URL_LIVE:-${BACKEND_URL:-}}" \
    MERIDIAN_API_KEY "${MERIDIAN_API_KEY:-}" \
    MERIDIAN_TOKEN_PACKAGE "${MERIDIAN_TOKEN_PACKAGE:-}"
fi

if [[ -n "$MCP_ID" ]]; then
  echo "==> Uploading env to meridian-mcp-server..."
  upload_service_env "$MCP_ID" \
    NODE_ENV production \
    MERIDIAN_MCP_TRANSPORT http \
    MERIDIAN_MCP_HOST 0.0.0.0 \
    BACKEND_URL "${BACKEND_URL_LIVE:-${BACKEND_URL:-}}" \
    MERIDIAN_API_KEY "${MERIDIAN_API_KEY:-}" \
    CASPER_RPC_URL "${CASPER_RPC_URL:-}" \
    CASPER_API_KEY "${CASPER_API_KEY:-}" \
    MERIDIAN_CONTRACTS_PATH deployed/addresses.json \
    X402_FACILITATOR_URL "${X402_URL_LIVE:-${X402_FACILITATOR_URL:-}}" \
    X402_RESOURCE_URL "${RESOURCE_URL_LIVE:-}"
fi

trigger_deploy() {
  local ID="$1"
  curl -sS -X POST -H "$AUTH" "https://api.render.com/v1/services/$ID/deploys" \
    -d '{"clearCache":"do_not_clear"}' -H "Content-Type: application/json" >/dev/null || true
}

echo "==> Triggering deploys..."
for ID in "$BACKEND_ID" "$AGENTS_ID" "$X402_ID" "$RESOURCE_ID" "$MCP_ID"; do
  [[ -n "$ID" ]] && trigger_deploy "$ID"
done

echo "DEPLOYMENT_INFO_JSON=$(node -e "console.log(JSON.stringify({
  backend: process.argv[1],
  backendUrl: process.argv[2],
  x402Url: process.argv[3],
  resourceUrl: process.argv[4],
  mcpUrl: process.argv[5],
  backendId: process.argv[6],
  agentsId: process.argv[7],
  x402Id: process.argv[8],
  resourceId: process.argv[9],
  mcpId: process.argv[10]
}))" "$BACKEND_ID" "$BACKEND_URL_LIVE" "$X402_URL_LIVE" "$RESOURCE_URL_LIVE" "$MCP_URL_LIVE" "$BACKEND_ID" "$AGENTS_ID" "$X402_ID" "$RESOURCE_ID" "$MCP_ID")"
echo "Done."
