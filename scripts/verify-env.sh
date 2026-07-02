#!/usr/bin/env bash
# MERIDIAN environment validation — never prints secret values
# Safe parser: does NOT source .env (multiline PEM breaks shell source)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

pass=0
fail=0
warn=0

env_has() {
  local name="$1"
  grep -q "^${name}=" .env 2>/dev/null || grep -q "^${name}=" .env
}

env_value_nonempty() {
  local name="$1"
  local line
  line=$(grep "^${name}=" .env 2>/dev/null | tail -1 || true)
  [[ -n "$line" ]] || return 1
  local val="${line#*=}"
  val="${val%%$'\r'}"
  [[ -n "$val" ]] && [[ "$val" != "changeme" ]] && [[ "$val" != "TODO" ]]
}

check_var() {
  local name="$1"
  local required="${2:-yes}"
  if env_value_nonempty "$name"; then
    echo -e "${GREEN}PASS${NC} | env | $name is set"
    pass=$((pass + 1))
    return 0
  fi
  if [[ "$required" == "yes" ]]; then
    echo -e "${RED}FAIL${NC} | env | $name is missing or placeholder"
    fail=$((fail + 1))
    return 1
  fi
  echo -e "${YELLOW}WARN${NC} | env | $name not set (deferred)"
  warn=$((warn + 1))
  return 0
}

if [[ ! -f .env ]]; then
  echo -e "${RED}FAIL${NC} | env | .env file not found"
  exit 1
fi

echo "=== MERIDIAN verify-env.sh (Phase 1 cloud) ==="

check_var CASPER_NETWORK
check_var CASPER_RPC_URL
check_var CASPER_CHAIN_NAME
check_var CASPER_API_KEY
check_var CASPER_SIDE_CAR_URL
check_var DATABASE_URL
check_var SUPABASE_URL
check_var SUPABASE_ANON_KEY
check_var SUPABASE_SERVICE_ROLE_KEY
check_var UPSTASH_REDIS_REST_URL
check_var UPSTASH_REDIS_REST_TOKEN

if env_value_nonempty OPENAI_API_KEY || env_value_nonempty openai_api_key; then
  echo -e "${GREEN}PASS${NC} | env | OpenAI key present (OPENAI_API_KEY or openai_api_key)"
  pass=$((pass + 1))
else
  echo -e "${RED}FAIL${NC} | env | OpenAI key missing"
  fail=$((fail + 1))
fi

if env_value_nonempty OPENAI_BASE_URL; then
  echo -e "${GREEN}PASS${NC} | env | OPENAI_BASE_URL is set"
  pass=$((pass + 1))
else
  echo -e "${YELLOW}WARN${NC} | env | OPENAI_BASE_URL not set (defaults to https://zenmux.ai/api/v1 in code)"
  warn=$((warn + 1))
fi

if env_value_nonempty OPENAI_MODEL; then
  echo -e "${GREEN}PASS${NC} | env | OPENAI_MODEL is set ($(
    grep '^OPENAI_MODEL=' .env | tail -1 | cut -d= -f2-
  ))"
  pass=$((pass + 1))
else
  echo -e "${YELLOW}WARN${NC} | env | OPENAI_MODEL not set (defaults to z-ai/glm-5.2 in code)"
  warn=$((warn + 1))
fi

check_var MERIDIAN_DEPLOYER_PUBLIC_KEY no
check_var MERIDIAN_DEPLOYER_PRIVATE_KEY_PEM no

if env_value_nonempty MERIDIAN_DEPLOYER_PRIVATE_KEY_PEM; then
  pem_line=$(grep '^MERIDIAN_DEPLOYER_PRIVATE_KEY_PEM=' .env | tail -1)
  pem_val="${pem_line#*=}"
  pem_val="${pem_val%%$'\r'}"
  if [[ "$pem_val" == *BEGIN* ]]; then
    echo -e "${GREEN}PASS${NC} | env | deployer PEM is inline in .env"
    pass=$((pass + 1))
  else
    echo -e "${RED}FAIL${NC} | env | deployer PEM must be inline (run: node scripts/inline-pem-env.mjs)"
    fail=$((fail + 1))
  fi
fi

for agent_key in MERIDIAN_YIELD_AGENT_PRIVATE_KEY_PEM MERIDIAN_COMPLIANCE_AGENT_PRIVATE_KEY_PEM MERIDIAN_AUDIT_AGENT_PRIVATE_KEY_PEM; do
  if env_value_nonempty "$agent_key"; then
    line=$(grep "^${agent_key}=" .env | tail -1)
    val="${line#*=}"
    val="${val%%$'\r'}"
    if [[ "$val" == *BEGIN* ]]; then
      echo -e "${GREEN}PASS${NC} | env | $agent_key is inline"
      pass=$((pass + 1))
    else
      echo -e "${RED}FAIL${NC} | env | $agent_key must be inline PEM"
      fail=$((fail + 1))
    fi
  fi
done

check_var MERIDIAN_YIELD_AGENT_PUBLIC_KEY no
check_var MERIDIAN_YIELD_AGENT_ACCOUNT_HASH no
check_var MERIDIAN_COMPLIANCE_AGENT_PUBLIC_KEY no
check_var MERIDIAN_COMPLIANCE_AGENT_ACCOUNT_HASH no
check_var MERIDIAN_AUDIT_AGENT_PUBLIC_KEY no
check_var MERIDIAN_AUDIT_AGENT_ACCOUNT_HASH no

check_var ANTHROPIC_API_KEY no
check_var GOOGLE_API_KEY no

if grep -q '^REDIS_URL=.*localhost' .env 2>/dev/null; then
  echo -e "${YELLOW}WARN${NC} | env | REDIS_URL points to localhost — use Upstash vars in cloud architecture"
  warn=$((warn + 1))
fi

if grep -q '^SUPABASE_URL=.*/rest/v1' .env 2>/dev/null; then
  echo -e "${YELLOW}WARN${NC} | env | SUPABASE_URL should be project base URL, not /rest/v1 path"
  warn=$((warn + 1))
fi

if grep -c '^DATABASE_URL=' .env 2>/dev/null | grep -q '^2'; then
  echo -e "${YELLOW}WARN${NC} | env | duplicate DATABASE_URL entries — remove empty first entry"
  warn=$((warn + 1))
fi
if env_value_nonempty deployer_public_key && ! env_value_nonempty MERIDIAN_DEPLOYER_PUBLIC_KEY; then
  echo -e "${YELLOW}WARN${NC} | env | deployer_public_key set but MERIDIAN_DEPLOYER_PUBLIC_KEY empty (map before Phase 4)"
  warn=$((warn + 1))
fi

echo ""
echo "Summary: pass=$pass fail=$fail warn=$warn"

if [[ "$fail" -gt 0 ]]; then
  exit 1
fi
exit 0
