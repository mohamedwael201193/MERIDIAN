# ENVIRONMENT_REQUIREMENTS.md

> **Companion file to:** `FINAL_PROMPT.md`
> **Purpose:** Document every environment variable, every required account, every API key, every verification step.
> **Rule:** Nothing is allowed to start until every ENV variable is verified. No placeholders. No "I'll fill it in later."

---

## 0. How To Use This File

1. Complete every action in `USER_ACTIONS.md` first.
2. Copy `.env.example` (generated in Phase 1) to `.env`.
3. Fill in every value in `.env` from the sources documented below.
4. Run `./scripts/verify-env.sh`. ALL 10 checks must pass.
5. Only then may Cursor proceed to Phase 2.

If any value is unknown, MISSING, or set to a placeholder like `changeme` or `TODO`, the verification script will fail and Cursor will halt.

---

## 1. Casper Network Variables

### 1.1 `CASPER_NETWORK`

- **Purpose:** Identifies which Casper network to target (testnet vs mainnet).
- **Why we need it:** Every Casper RPC call, every TransactionV1, every contract deployment specifies the network name.
- **Where to obtain:** Choose based on deployment target. Hackathon scope: testnet only.
- **Official link:** https://docs.casper.network/concepts/deploying-to-network
- **Account creation steps:** N/A (network parameter, not an account).
- **Pricing:** Free.
- **Free tier:** Yes (testnet is free; mainnet requires CSPR for gas).
- **Testnet value:** `casper-test`
- **Production value:** `casper`
- **Example:**
  ```bash
  export CASPER_NETWORK=casper-test
  ```
- **Verification:**
  ```bash
  curl -s -X POST -H "Content-Type: application/json" \
    --data '{"id":1,"jsonrpc":"2.0","method":"info_get_status","params":null}' \
    https://node.cspr.cloud/rpc | jq '.result.chainspec_name'
  # Should return: "casper-test"
  ```

### 1.2 `CASPER_RPC_URL`

- **Purpose:** JSON-RPC endpoint for submitting transactions and querying state.
- **Why we need it:** Every `casper-client` command, every backend RPC call uses this URL.
- **Where to obtain:** CSPR.cloud Node API (free tier) or self-hosted Casper node.
- **Official link:** https://docs.cspr.cloud/node-api
- **Account creation steps:** Sign up at https://cspr.cloud → Profile → API Keys → Create new key (gives access to REST + Streaming + Node API).
- **Pricing:** Free tier (rate-limited to ~5 req/sec); Pro tier (paid, higher limits).
- **Free tier:** Yes (sufficient for hackathon).
- **Testnet value:** `https://node.cspr.cloud/rpc`
- **Production value:** `https://node.cspr.cloud/rpc` (or self-hosted node for production scale)
- **Example:**
  ```bash
  export CASPER_RPC_URL=https://node.cspr.cloud/rpc
  ```
- **Verification:**
  ```bash
  casper-client get-node-status --node-address $CASPER_RPC_URL | jq '.result.chainspec_name'
  # Should return: "casper-test"
  ```

### 1.3 `CASPER_API_KEY`

- **Purpose:** Authentication for CSPR.cloud REST + Streaming + Node APIs.
- **Why we need it:** CSPR.cloud requires API key in `Authorization` header for all requests.
- **Where to obtain:** CSPR.cloud portal.
- **Official link:** https://cspr.cloud
- **Account creation steps:**
  1. Go to https://cspr.cloud
  2. Click "Sign up"
  3. Verify email
  4. Navigate to Profile → API Keys
  5. Click "Create new key"
  6. Copy the key (shown only once)
- **Pricing:** Free tier (rate-limited); Pro tier (paid, contact sales).
- **Free tier:** Yes.
- **Testnet value:** `<your-api-key>` (32-char hex string)
- **Production value:** Same (or upgrade to Pro for higher rate limits).
- **Example:**
  ```bash
  export CASPER_API_KEY=abc123def456...  # 32-char hex
  ```
- **Verification:**
  ```bash
  curl -s -H "Authorization: $CASPER_API_KEY" \
    https://api.cspr.cloud/accounts | jq '.data | length'
  # Should return a non-null number (current account count on chain)
  ```
- **⚠️ SECURITY:** Never commit this key to git. Never expose in client-side code. Add to `.gitignore`.

### 1.4 `CASPER_CHAIN_NAME`

- **Purpose:** Chain name used in TransactionV1 construction (must match `CASPER_NETWORK`).
- **Why we need it:** Every TransactionV1 must specify the chain name to prevent cross-chain replay attacks.
- **Where to obtain:** Same as `CASPER_NETWORK`.
- **Official link:** https://docs.casper.network/developers/cli/making-transactions
- **Testnet value:** `casper-test`
- **Production value:** `casper`
- **Example:**
  ```bash
  export CASPER_CHAIN_NAME=casper-test
  ```

### 1.5 `CASPER_SIDE_CAR_URL`

- **Purpose:** REST + SSE endpoint for event consumption.
- **Why we need it:** Backend event listener subscribes to Sidecar SSE for real-time CEP-88 events.
- **Where to obtain:** CSPR.cloud REST API (includes Sidecar-equivalent functionality) or self-hosted Sidecar.
- **Official link:** https://docs.cspr.cloud + https://docs.casper.network/operators/setup/casper-sidecar
- **Pricing:** Free tier via CSPR.cloud.
- **Testnet value:** `https://api.cspr.cloud`
- **Production value:** `https://api.cspr.cloud` (or self-hosted Sidecar for production)
- **Example:**
  ```bash
  export CASPER_SIDE_CAR_URL=https://api.cspr.cloud
  ```
- **Verification:**
  ```bash
  curl -s -H "Authorization: $CASPER_API_KEY" \
    $CASPER_SIDE_CAR_URL/health
  # Should return 200 OK
  ```

---

## 2. Deployer Key Variables

### 2.1 `MERIDIAN_DEPLOYER_PUBLIC_KEY`

- **Purpose:** Ed25519 public key (hex) of the deployer account that deploys all 5 contracts.
- **Why we need it:** Used in every deployment transaction; registered as contract owner.
- **Where to obtain:** Generate via `casper-client keygen`.
- **Official link:** https://docs.casper.network/developers/cli/keygen
- **Account creation steps:**
  ```bash
  casper-client keygen -a ed25519 ./keys/meridian-deployer
  # Produces: public_key.pem, public_key_hex, secret_key.pem
  ```
- **Testnet value:** `<64-char hex public key>` (from `public_key_hex` file)
- **Production value:** Different keypair (NEVER reuse testnet keys on mainnet)
- **Example:**
  ```bash
  export MERIDIAN_DEPLOYER_PUBLIC_KEY=0202abc123...  # 66 chars (02 prefix + 64 hex)
  ```
- **Verification:**
  ```bash
  casper-client get-account-info \
    --node-address $CASPER_RPC_URL \
    --public-key $MERIDIAN_DEPLOYER_PUBLIC_KEY | jq '.result.balance'
  # Should return balance in motes; must be ≥ 100000000000 (100 CSPR)
  ```

### 2.2 `MERIDIAN_DEPLOYER_PRIVATE_KEY_PEM`

- **Purpose:** Path to PEM file containing the deployer's Ed25519 private key.
- **Why we need it:** Every deployment transaction must be signed by the deployer.
- **Where to obtain:** Generated by `casper-client keygen` (see 2.1).
- **Official link:** https://docs.casper.network/developers/cli/keygen
- **Testnet value:** `/absolute/path/to/keys/meridian-deployer/secret_key.pem`
- **Production value:** Different path (different keypair)
- **Example:**
  ```bash
  export MERIDIAN_DEPLOYER_PRIVATE_KEY_PEM=/home/user/keys/meridian-deployer/secret_key.pem
  ```
- **⚠️ SECURITY:** File permissions MUST be 600 (`chmod 600`). NEVER commit PEM files. NEVER log file contents. NEVER set this to the key content itself (always a path).
- **Verification:**
  ```bash
  ls -la $MERIDIAN_DEPLOYER_PRIVATE_KEY_PEM
  # Should show: -rw------- (600 permissions)
  casper-client make-transfer \
    --node-address $CASPER_RPC_URL \
    --chain-name $CASPER_CHAIN_NAME \
    --secret-key $MERIDIAN_DEPLOYER_PRIVATE_KEY_PEM \
    --from $MERIDIAN_DEPLOYER_PUBLIC_KEY \
    --to $MERIDIAN_DEPLOYER_PUBLIC_KEY \
    --amount 1 \
    --payment-amount 100000000 \
    --dry-run
  # Should succeed (validates key + signing)
  ```

### 2.3 `MERIDIAN_DEPLOYER_ACCOUNT_HASH`

- **Purpose:** Derived account hash (verification only; not used in transactions).
- **Why we need it:** Used in logs, audit trails, and to verify the public key derivation is correct.
- **Where to obtain:** Derived from public key via `casper-client account-address`.
- **Testnet value:** `<34-char hex>` prefixed with `account-hash-`
- **Example:**
  ```bash
  export MERIDIAN_DEPLOYER_ACCOUNT_HASH=$(casper-client account-address \
    --public-key $MERIDIAN_DEPLOYER_PUBLIC_KEY)
  ```
- **Verification:**
  ```bash
  echo $MERIDIAN_DEPLOYER_ACCOUNT_HASH
  # Should return: account-hash-<hex>
  ```

---

## 3. Agent Key Variables

Each of the 3 AI agents (YieldAgent, ComplianceAgent, AuditAgent) has its own Ed25519 keypair. The public keys are registered in the relevant smart contracts (StakingVault curator, ComplianceRegistry revoker, MeridianAudit signer). The private keys are used to sign agent-submitted transactions.

### 3.1 `MERIDIAN_YIELD_AGENT_PUBLIC_KEY`

- **Purpose:** Public key of the YieldAgent. Registered as `validator_curator` in StakingVault.
- **Where to obtain:** `casper-client keygen -a ed25519 ./keys/yield-agent`
- **Testnet value:** `<66-char hex>` (02 prefix + 64 hex)
- **Example:**
  ```bash
  export MERIDIAN_YIELD_AGENT_PUBLIC_KEY=0202def456...
  ```

### 3.2 `MERIDIAN_YIELD_AGENT_PRIVATE_KEY_PEM`

- **Purpose:** Path to YieldAgent's private key PEM file.
- **Testnet value:** `/absolute/path/to/keys/yield-agent/secret_key.pem`
- **⚠️ SECURITY:** File permissions 600. Never commit. Never log.
- **Example:**
  ```bash
  export MERIDIAN_YIELD_AGENT_PRIVATE_KEY_PEM=/home/user/keys/yield-agent/secret_key.pem
  ```

### 3.3 `MERIDIAN_COMPLIANCE_AGENT_PUBLIC_KEY`

- **Purpose:** Public key of the ComplianceAgent. Registered as `revoker` in ComplianceRegistry.
- **Where to obtain:** `casper-client keygen -a ed25519 ./keys/compliance-agent`
- **Testnet value:** `<66-char hex>`
- **Example:**
  ```bash
  export MERIDIAN_COMPLIANCE_AGENT_PUBLIC_KEY=0202ghi789...
  ```

### 3.4 `MERIDIAN_COMPLIANCE_AGENT_PRIVATE_KEY_PEM`

- **Purpose:** Path to ComplianceAgent's private key PEM file.
- **Testnet value:** `/absolute/path/to/keys/compliance-agent/secret_key.pem`
- **⚠️ SECURITY:** File permissions 600.
- **Example:**
  ```bash
  export MERIDIAN_COMPLIANCE_AGENT_PRIVATE_KEY_PEM=/home/user/keys/compliance-agent/secret_key.pem
  ```

### 3.5 `MERIDIAN_AUDIT_AGENT_PUBLIC_KEY`

- **Purpose:** Public key of the AuditAgent. Registered as `signer` in MeridianAudit.
- **Where to obtain:** `casper-client keygen -a ed25519 ./keys/audit-agent`
- **Testnet value:** `<66-char hex>`
- **Example:**
  ```bash
  export MERIDIAN_AUDIT_AGENT_PUBLIC_KEY=0202jkl012...
  ```

### 3.6 `MERIDIAN_AUDIT_AGENT_PRIVATE_KEY_PEM`

- **Purpose:** Path to AuditAgent's private key PEM file.
- **Testnet value:** `/absolute/path/to/keys/audit-agent/secret_key.pem`
- **⚠️ SECURITY:** File permissions 600.
- **Example:**
  ```bash
  export MERIDIAN_AUDIT_AGENT_PRIVATE_KEY_PEM=/home/user/keys/audit-agent/secret_key.pem
  ```

### Agent Key Verification (all 3 agents)

```bash
for agent in yield-agent compliance-agent audit-agent; do
  echo "Verifying $agent..."
  PUBLIC_KEY_VAR="MERIDIAN_$(echo $agent | tr 'a-z-' 'A-Z_')_PUBLIC_KEY"
  PRIVATE_KEY_VAR="MERIDIAN_$(echo $agent | tr 'a-z-' 'A-Z_')_PRIVATE_KEY_PEM"
  
  # Verify public key resolves to an account
  casper-client get-account-info \
    --node-address $CASPER_RPC_URL \
    --public-key ${!PUBLIC_KEY_VAR} > /dev/null 2>&1
  
  if [ $? -ne 0 ]; then
    echo "FAIL: $agent public key invalid or account not funded"
    exit 1
  fi
  
  # Verify private key file exists and has 600 perms
  if [ ! -f "${!PRIVATE_KEY_VAR}" ]; then
    echo "FAIL: $agent private key file not found"
    exit 1
  fi
  
  PERMS=$(stat -c "%a" "${!PRIVATE_KEY_VAR}")
  if [ "$PERMS" != "600" ]; then
    echo "FAIL: $agent private key file permissions are $PERMS, must be 600"
    exit 1
  fi
  
  echo "  ✓ $agent keys valid"
done
```

---

## 4. AI Provider API Keys

### 4.1 `ANTHROPIC_API_KEY`

- **Purpose:** Calls Claude Sonnet 4.5 (YieldAgent primary, ComplianceAgent fallback).
- **Where to obtain:** https://console.anthropic.com
- **Official link:** https://docs.anthropic.com
- **Account creation steps:**
  1. Go to https://console.anthropic.com
  2. Sign up (email + password)
  3. Add payment method (required for API access)
  4. Navigate to API Keys
  5. Click "Create Key"
  6. Copy key (starts with `sk-ant-`)
- **Pricing:** Pay-per-token. Sonnet 4.5: $3/M input, $15/M output.
- **Free tier:** $5 credit on signup (sufficient for hackathon development).
- **Testnet value:** `sk-ant-...`
- **Production value:** Same (or upgrade to higher tier).
- **Example:**
  ```bash
  export ANTHROPIC_API_KEY=sk-ant-api03-...
  ```
- **Verification:**
  ```bash
  curl -s https://api.anthropic.com/v1/models \
    -H "x-api-key: $ANTHROPIC_API_KEY" \
    -H "anthropic-version: 2023-06-01" | jq '.data | length'
  # Should return a number > 0
  ```
- **⚠️ SECURITY:** Never commit. Never expose in client-side code. Add to `.gitignore`.

### 4.2 `OPENAI_API_KEY`

- **Purpose:** Calls GPT-4o (ComplianceAgent primary, YieldAgent fallback).
- **Where to obtain:** https://platform.openai.com
- **Official link:** https://platform.openai.com/docs
- **Account creation steps:**
  1. Go to https://platform.openai.com
  2. Sign up
  3. Add payment method
  4. Navigate to API Keys
  5. Click "Create new secret key"
  6. Copy key (starts with `sk-`)
- **Pricing:** Pay-per-token. GPT-4o: $5/M input, $15/M output.
- **Free tier:** $5 credit on signup.
- **Testnet value:** `sk-...`
- **Production value:** Same.
- **Example:**
  ```bash
  export OPENAI_API_KEY=sk-proj-...
  ```
- **Verification:**
  ```bash
  curl -s https://api.openai.com/v1/models \
    -H "Authorization: Bearer $OPENAI_API_KEY" | jq '.data | length'
  # Should return a number > 0
  ```

### 4.3 `GOOGLE_API_KEY`

- **Purpose:** Calls Gemini 2.5 Flash (AuditAgent primary).
- **Where to obtain:** https://aistudio.google.com
- **Official link:** https://ai.google.dev/docs
- **Account creation steps:**
  1. Go to https://aistudio.google.com
  2. Sign in with Google account
  3. Navigate to "Get API key"
  4. Click "Create API key"
  5. Copy key (starts with `AIza...`)
- **Pricing:** Pay-per-token. Gemini 2.5 Flash: $0.075/M input, $0.30/M output.
- **Free tier:** Yes (generous free tier; sufficient for hackathon).
- **Testnet value:** `AIza...`
- **Production value:** Same.
- **Example:**
  ```bash
  export GOOGLE_API_KEY=AIzaSy...
  ```
- **Verification:**
  ```bash
  curl -s "https://generativelanguage.googleapis.com/v1/models?key=$GOOGLE_API_KEY" | jq '.models | length'
  # Should return a number > 0
  ```

---

## 5. Database Variables

### 5.1 `DATABASE_URL`

- **Purpose:** PostgreSQL connection string for the backend.
- **Where to obtain:** Local PostgreSQL instance or managed service (Supabase, Neon, etc.).
- **Official link:** https://www.postgresql.org/docs/current/libpq-connect.html
- **Account creation steps:** Install PostgreSQL locally OR sign up for managed service.
- **Pricing:** Local = free. Managed = free tier available (Supabase, Neon).
- **Free tier:** Yes.
- **Testnet value:** `postgres://meridian:password@localhost:5432/meridian`
- **Production value:** Managed PostgreSQL connection string (Supabase/Neon/RDS).
- **Example:**
  ```bash
  export DATABASE_URL=postgres://meridian:secretpass@localhost:5432/meridian
  ```
- **Verification:**
  ```bash
  psql $DATABASE_URL -c 'SELECT 1'
  # Should return: 1
  ```

### 5.2 `REDIS_URL`

- **Purpose:** Redis connection string for agent pub/sub.
- **Where to obtain:** Local Redis or managed service (Upstash, Redis Cloud).
- **Official link:** https://redis.io/docs
- **Account creation steps:** Install Redis locally OR sign up for managed service.
- **Pricing:** Local = free. Managed = free tier available.
- **Free tier:** Yes.
- **Testnet value:** `redis://localhost:6379`
- **Production value:** Managed Redis connection string.
- **Example:**
  ```bash
  export REDIS_URL=redis://localhost:6379
  ```
- **Verification:**
  ```bash
  redis-cli -u $REDIS_URL ping
  # Should return: PONG
  ```

---

## 6. External Data APIs

### 6.1 `OFAC_SDN_FEED_URL`

- **Purpose:** OFAC Specially Designated Nationals (SDN) list XML feed. Used by ComplianceAgent to screen wallet addresses.
- **Where to obtain:** U.S. Treasury OFAC website (free, public).
- **Official link:** https://www.treasury.gov/resource-center/sanctions/SDN-List/Pages/default.aspx
- **Pricing:** Free.
- **Testnet value:** `https://www.treasury.gov/ofac/downloads/sdn.xml`
- **Production value:** Same.
- **Example:**
  ```bash
  export OFAC_SDN_FEED_URL=https://www.treasury.gov/ofac/downloads/sdn.xml
  ```
- **Verification:**
  ```bash
  curl -sI $OFAC_SDN_FEED_URL | head -1
  # Should return: HTTP/2 200
  ```

### 6.2 `EU_CONSOLIDATED_LIST_URL`

- **Purpose:** EU consolidated financial sanctions list XML feed.
- **Where to obtain:** European Commission.
- **Official link:** https://webgate.ec.europa.eu/fsd/fsf
- **Pricing:** Free.
- **Testnet value:** `https://webgate.ec.europa.eu/fsd/fsf/public/files/xmlFullSanctionsList_1_1/content`
- **Production value:** Same.
- **Example:**
  ```bash
  export EU_CONSOLIDATED_LIST_URL=https://webgate.ec.europa.eu/fsd/fsf/public/files/xmlFullSanctionsList_1_1/content
  ```
- **Verification:**
  ```bash
  curl -sI $EU_CONSOLIDATED_LIST_URL | head -1
  # Should return: HTTP/2 200
  ```

---

## 7. Frontend Variables

### 7.1 `NEXT_PUBLIC_CASPER_NETWORK`

- **Purpose:** Exposed to browser; tells frontend which network to target.
- **Why we need it:** CSPR.click SDK initialization requires network name.
- **Where to obtain:** Same as `CASPER_NETWORK` but exposed to browser via `NEXT_PUBLIC_` prefix.
- **Testnet value:** `casper-test`
- **Production value:** `casper`
- **Example:**
  ```bash
  export NEXT_PUBLIC_CASPER_NETWORK=casper-test
  ```

### 7.2 `NEXT_PUBLIC_MERIDIAN_CONTRACT_PACKAGE_HASH`

- **Purpose:** Contract package hash of the MeridianToken contract. Exposed to browser so frontend can construct TransactionV1 calls.
- **Where to obtain:** Generated in Phase 4 (testnet deployment). Stored in `deployed/addresses.json`.
- **Testnet value:** `<hex>` (set AFTER Phase 4 deployment)
- **Production value:** Different hash (after mainnet deployment)
- **Example:**
  ```bash
  # After Phase 4:
  export NEXT_PUBLIC_MERIDIAN_CONTRACT_PACKAGE_HASH=0x...
  ```

### 7.3 `NEXT_PUBLIC_MCP_SERVER_URL`

- **Purpose:** URL of the Meridian MCP server. Exposed to browser for any client-side MCP calls (rare; most MCP calls happen server-side).
- **Where to obtain:** Self-hosted MCP server URL.
- **Testnet value:** `http://localhost:3002` (dev) or `https://mcp.meridian.casper.network` (prod)
- **Production value:** `https://mcp.meridian.casper.network`
- **Example:**
  ```bash
  export NEXT_PUBLIC_MCP_SERVER_URL=http://localhost:3002
  ```

---

## 8. x402 Facilitator Variables

### 8.1 `X402_FACILITATOR_PORT`

- **Purpose:** Port the x402 facilitator listens on.
- **Where to obtain:** Choose any free port.
- **Testnet value:** `3001`
- **Production value:** `3001` (or behind reverse proxy)
- **Example:**
  ```bash
  export X402_FACILITATOR_PORT=3001
  ```

### 8.2 `X402_PAYMENT_TOKEN_CONTRACT_HASH`

- **Purpose:** Contract hash of the CEP-18 token used for x402 micropayments.
- **Where to obtain:** Deployed in Phase 4 (a separate CEP-18 token contract for x402 payments).
- **Testnet value:** `<hex>` (set AFTER Phase 4 deployment)
- **Production value:** Different hash
- **Example:**
  ```bash
  # After Phase 4:
  export X402_PAYMENT_TOKEN_CONTRACT_HASH=hash-...
  ```

---

## 9. Verification Script (`scripts/verify-env.sh`)

```bash
#!/bin/bash
# scripts/verify-env.sh
# Verifies every environment variable is set and reachable.
# ALL checks must pass before any code can run.

set -euo pipefail

PASS=0
FAIL=0

check() {
  local name="$1"
  local cmd="$2"
  if eval "$cmd" >/dev/null 2>&1; then
    echo "  ✓ $name"
    PASS=$((PASS + 1))
  else
    echo "  ✗ $name"
    FAIL=$((FAIL + 1))
  fi
}

echo "=== Meridian Environment Verification ==="
echo ""

echo "1. Casper Network:"
check "CASPER_NETWORK set" '[ -n "$CASPER_NETWORK" ]'
check "CASPER_RPC_URL set" '[ -n "$CASPER_RPC_URL" ]'
check "CASPER_API_KEY set" '[ -n "$CASPER_API_KEY" ]'
check "CASPER_CHAIN_NAME set" '[ -n "$CASPER_CHAIN_NAME" ]'
check "CASPER_SIDE_CAR_URL set" '[ -n "$CASPER_SIDE_CAR_URL" ]'
check "RPC reachable" 'curl -s -X POST -H "Content-Type: application/json" --data "{\"id\":1,\"jsonrpc\":\"2.0\",\"method\":\"info_get_status\",\"params\":null}" $CASPER_RPC_URL | jq -e ".result.chainspec_name" >/dev/null'
check "CSPR.cloud API key valid" 'curl -s -H "Authorization: $CASPER_API_KEY" $CASPER_SIDE_CAR_URL/accounts | jq -e ".data" >/dev/null'
echo ""

echo "2. Deployer Keys:"
check "MERIDIAN_DEPLOYER_PUBLIC_KEY set" '[ -n "$MERIDIAN_DEPLOYER_PUBLIC_KEY" ]'
check "MERIDIAN_DEPLOYER_PRIVATE_KEY_PEM set" '[ -n "$MERIDIAN_DEPLOYER_PRIVATE_KEY_PEM" ]'
check "Deployer key file exists" '[ -f "$MERIDIAN_DEPLOYER_PRIVATE_KEY_PEM" ]'
check "Deployer key file perms 600" '[ "$(stat -c "%a" $MERIDIAN_DEPLOYER_PRIVATE_KEY_PEM)" = "600" ]'
check "Deployer account funded (≥100 CSPR)" 'casper-client get-account-info --node-address $CASPER_RPC_URL --public-key $MERIDIAN_DEPLOYER_PUBLIC_KEY | jq -e ".result.balance | tonumber >= 100000000000" >/dev/null'
echo ""

echo "3. Agent Keys (YieldAgent, ComplianceAgent, AuditAgent):"
for agent in yield_agent compliance_agent audit_agent; do
  VAR_PREFIX="MERIDIAN_$(echo $agent | tr 'a-z' 'A-Z')"
  check "${agent} public key set" "[ -n \"\$${VAR_PREFIX}_PUBLIC_KEY\" ]"
  check "${agent} private key PEM set" "[ -n \"\$${VAR_PREFIX}_PRIVATE_KEY_PEM\" ]"
  check "${agent} key file exists" "[ -f \"\$${VAR_PREFIX}_PRIVATE_KEY_PEM\" ]"
  check "${agent} key file perms 600" "[ \"\$(stat -c \"%a\" \$${VAR_PREFIX}_PRIVATE_KEY_PEM)\" = \"600\" ]"
done
echo ""

echo "4. AI Provider APIs:"
check "ANTHROPIC_API_KEY set" '[ -n "$ANTHROPIC_API_KEY" ]'
check "Anthropic API reachable" 'curl -s https://api.anthropic.com/v1/models -H "x-api-key: $ANTHROPIC_API_KEY" -H "anthropic-version: 2023-06-01" | jq -e ".data | length > 0" >/dev/null'
check "OPENAI_API_KEY set" '[ -n "$OPENAI_API_KEY" ]'
check "OpenAI API reachable" 'curl -s https://api.openai.com/v1/models -H "Authorization: Bearer $OPENAI_API_KEY" | jq -e ".data | length > 0" >/dev/null'
check "GOOGLE_API_KEY set" '[ -n "$GOOGLE_API_KEY" ]'
check "Google AI API reachable" 'curl -s "https://generativelanguage.googleapis.com/v1/models?key=$GOOGLE_API_KEY" | jq -e ".models | length > 0" >/dev/null'
echo ""

echo "5. Database:"
check "DATABASE_URL set" '[ -n "$DATABASE_URL" ]'
check "PostgreSQL reachable" 'psql $DATABASE_URL -c "SELECT 1" >/dev/null'
check "REDIS_URL set" '[ -n "$REDIS_URL" ]'
check "Redis reachable" 'redis-cli -u $REDIS_URL ping | grep -q PONG'
echo ""

echo "6. External Data APIs:"
check "OFAC_SDN_FEED_URL set" '[ -n "$OFAC_SDN_FEED_URL" ]'
check "OFAC feed reachable" 'curl -sI $OFAC_SDN_FEED_URL | head -1 | grep -q "200"'
check "EU_CONSOLIDATED_LIST_URL set" '[ -n "$EU_CONSOLIDATED_LIST_URL" ]'
check "EU list reachable" 'curl -sI $EU_CONSOLIDATED_LIST_URL | head -1 | grep -q "200"'
echo ""

echo "=== Summary ==="
echo "Passed: $PASS"
echo "Failed: $FAIL"
echo ""

if [ $FAIL -gt 0 ]; then
  echo "❌ VERIFICATION FAILED. Fix the failing checks before proceeding."
  exit 1
else
  echo "✅ ALL CHECKS PASSED. Ready to proceed."
  exit 0
fi
```

---

## 10. `.env.example` Template

```bash
# === Casper Network ===
CASPER_NETWORK=casper-test
CASPER_RPC_URL=https://node.cspr.cloud/rpc
CASPER_API_KEY=your-cspr-cloud-api-key
CASPER_CHAIN_NAME=casper-test
CASPER_SIDE_CAR_URL=https://api.cspr.cloud

# === Deployer Keys (NEVER commit real values) ===
MERIDIAN_DEPLOYER_PUBLIC_KEY=
MERIDIAN_DEPLOYER_PRIVATE_KEY_PEM=
MERIDIAN_DEPLOYER_ACCOUNT_HASH=

# === Agent Keys (NEVER commit real values) ===
MERIDIAN_YIELD_AGENT_PUBLIC_KEY=
MERIDIAN_YIELD_AGENT_PRIVATE_KEY_PEM=
MERIDIAN_COMPLIANCE_AGENT_PUBLIC_KEY=
MERIDIAN_COMPLIANCE_AGENT_PRIVATE_KEY_PEM=
MERIDIAN_AUDIT_AGENT_PUBLIC_KEY=
MERIDIAN_AUDIT_AGENT_PRIVATE_KEY_PEM=

# === AI Provider APIs (NEVER commit real values) ===
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
GOOGLE_API_KEY=

# === Database ===
DATABASE_URL=postgres://meridian:password@localhost:5432/meridian
REDIS_URL=redis://localhost:6379

# === External Data APIs ===
OFAC_SDN_FEED_URL=https://www.treasury.gov/ofac/downloads/sdn.xml
EU_CONSOLIDATED_LIST_URL=https://webgate.ec.europa.eu/fsd/fsf/public/files/xmlFullSanctionsList_1_1/content

# === Frontend (exposed to browser) ===
NEXT_PUBLIC_CASPER_NETWORK=casper-test
NEXT_PUBLIC_MERIDIAN_CONTRACT_PACKAGE_HASH=
NEXT_PUBLIC_MCP_SERVER_URL=http://localhost:3002

# === x402 Facilitator ===
X402_FACILITATOR_PORT=3001
X402_PAYMENT_TOKEN_CONTRACT_HASH=
```

---

## 11. Verification Checklist (Final)

Before any code can run (Phase 1+), the following MUST be true:

- [ ] All 23 environment variables are set in `.env` (no empty values, no placeholders)
- [ ] `.env` is in `.gitignore`
- [ ] `./scripts/verify-env.sh` passes ALL checks (exit code 0)
- [ ] Deployer wallet funded with ≥ 500 CSPR on testnet (for Phase 4 deployment)
- [ ] Each agent wallet funded with ≥ 50 CSPR on testnet (for transaction fees)
- [ ] All 3 AI provider APIs respond 200 to /models endpoint
- [ ] PostgreSQL reachable via `psql $DATABASE_URL -c 'SELECT 1'`
- [ ] Redis reachable via `redis-cli -u $REDIS_URL ping`
- [ ] All private key PEM files have 600 permissions
- [ ] No API keys or private keys committed to git (run `git log --all -p | grep -i "api_key\|secret_key\|password"` and verify 0 results)

**If any check fails, FIX THE ROOT CAUSE before proceeding.** Never set a variable to a placeholder value to "unblock" development.

---

**END OF ENVIRONMENT_REQUIREMENTS.md**
