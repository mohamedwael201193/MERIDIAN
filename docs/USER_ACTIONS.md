# USER_ACTIONS.md

> **Companion file to:** `FINAL_PROMPT.md` and `ENVIRONMENT_REQUIREMENTS.md`
> **Purpose:** Lists EVERY action that requires a human. Everything else is automated by Cursor.
> **Rule:** Complete these actions IN ORDER before Cursor starts Phase 0.

---

## 0. How To Use This File

1. Complete every action below in order.
2. As you complete each action, check the box (`[x]`).
3. After all actions are complete, run `./scripts/verify-env.sh` to verify.
4. Only then tell Cursor to start Phase 0.

**If any action is incomplete, Cursor will halt during Phase 0 verification.**

---

## 1. System Prerequisites (Install Software)

These are one-time installs on your development machine. Skip any that are already installed at the correct version.

### 1.1 Install Rust Toolchain

- [ ] **Action:** Install Rust 1.85+ stable with `wasm32-unknown-unknown` target.
- **Command (macOS/Linux):**
  ```bash
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --default-toolchain stable
  source "$HOME/.cargo/env"
  rustup target add wasm32-unknown-unknown
  ```
- **Verify:**
  ```bash
  rustc --version  # Must be ≥ 1.85.0
  rustup target list --installed | grep wasm32-unknown-unknown
  ```
- **Why:** Required to compile Odra smart contracts to WASM.
- **Official docs:** https://www.rust-lang.org/tools/install

### 1.2 Install `just` (Command Runner)

- [ ] **Action:** Install `just` v1.40.0+.
- **Command:**
  ```bash
  cargo install just --locked
  # OR on macOS:
  brew install just
  ```
- **Verify:**
  ```bash
  just --version  # Must be ≥ 1.40.0
  ```
- **Why:** Odra + x402 projects use `justfile` (not `Makefile`).
- **⚠️ DO NOT** install via `apt install just` (Ubuntu package is unmaintained v0.x).

### 1.3 Install `cargo-odra` (Odra CLI)

- [ ] **Action:** Install `cargo-odra` v0.1.7.
- **Command:**
  ```bash
  cargo install cargo-odra --version 0.1.7 --locked
  ```
- **Verify:**
  ```bash
  cargo odra --version  # Must be 0.1.7
  ```
- **Why:** Required to scaffold, build, and test Odra smart contracts.
- **⚠️ DO NOT** install without `--version 0.1.7 --locked` (causes reproducibility breaks).

### 1.4 Install `casper-client` (Rust CLI)

- [ ] **Action:** Install `casper-client` v5.0.1.
- **Command:**
  ```bash
  cargo install casper-client --version 5.0.1 --locked
  ```
- **Verify:**
  ```bash
  casper-client --version  # Must be 5.0.1
  ```
- **Why:** Required to generate keypairs, sign transactions, deploy contracts, query state.
- **⚠️ DO NOT** install without `--version 5.0.1 --locked`.

### 1.5 Install Node.js 20+

- [ ] **Action:** Install Node.js 20 LTS or later.
- **Command (via nvm — recommended):**
  ```bash
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
  source ~/.bashrc  # or ~/.zshrc
  nvm install 20
  nvm use 20
  ```
- **Verify:**
  ```bash
  node --version  # Must be v20.x or later
  npm --version
  ```
- **Why:** Required for backend, agents, MCP server, and frontend (all TypeScript).

### 1.6 Install PostgreSQL 15+

- [ ] **Action:** Install PostgreSQL 15 or later.
- **Command (macOS):**
  ```bash
  brew install postgresql@15
  brew services start postgresql@15
  ```
- **Command (Ubuntu):**
  ```bash
  sudo apt update
  sudo apt install postgresql postgresql-contrib
  sudo systemctl start postgresql
  ```
- **Alternative (Docker — recommended for consistency):**
  ```bash
  docker run -d --name meridian-postgres \
    -e POSTGRES_USER=meridian \
    -e POSTGRES_PASSWORD=secretpass \
    -e POSTGRES_DB=meridian \
    -p 5432:5432 \
    postgres:15
  ```
- **Verify:**
  ```bash
  psql postgres://meridian:secretpass@localhost:5432/meridian -c 'SELECT 1'
  # Should return: 1
  ```
- **Why:** Backend uses PostgreSQL for event indexing.

### 1.7 Install Redis 7+

- [ ] **Action:** Install Redis 7 or later.
- **Command (macOS):**
  ```bash
  brew install redis
  brew services start redis
  ```
- **Command (Ubuntu):**
  ```bash
  sudo apt install redis-server
  sudo systemctl start redis-server
  ```
- **Alternative (Docker — recommended):**
  ```bash
  docker run -d --name meridian-redis \
    -p 6379:6379 \
    redis:7
  ```
- **Verify:**
  ```bash
  redis-cli ping  # Should return: PONG
  ```
- **Why:** Agents use Redis pub/sub for inter-agent communication.

### 1.8 Install Docker Desktop

- [ ] **Action:** Install Docker Desktop (includes Docker Compose).
- **Command:**
  - macOS: https://docker.com/products/docker-desktop (download + install)
  - Linux: `sudo apt install docker.io docker-compose-plugin`
- **Verify:**
  ```bash
  docker --version
  docker compose version
  ```
- **Why:** Required for x402 facilitator (via `just docker-up`) and optional nctl local network.

---

## 2. Casper Accounts + Funding

### 2.1 Create Casper Wallet (Browser Extension)

- [ ] **Action:** Install Casper Wallet browser extension.
- **Steps:**
  1. Open your browser's extension store (Chrome Web Store / Firefox Add-ons / Safari App Store).
  2. Search for "Casper Wallet" (by MAKE).
  3. Install.
  4. Open the extension, create a new wallet.
  5. **Write down the 12-word seed phrase** in a secure offline location (NOT on your computer, NOT in cloud storage).
  6. Set a strong password.
- **Verify:** Extension shows your account address (starts with `01`).
- **Why:** Required for the frontend dApp wallet connection (via CSPR.click).
- **⚠️ SECURITY:** Never share your seed phrase. Never type it into any website other than the official Casper Wallet extension.

### 2.2 Create CSPR.cloud Account + API Key

- [ ] **Action:** Sign up for CSPR.cloud and create an API key.
- **Steps:**
  1. Go to https://cspr.cloud
  2. Click "Sign up"
  3. Enter email + password
  4. Verify email (click link in confirmation email)
  5. Log in
  6. Click your profile icon (top right) → "API Keys"
  7. Click "Create new key"
  8. Name it "Meridian Development"
  9. Copy the API key (32-char hex string) — **it is shown only once**
  10. Save it in your password manager (1Password, Bitwarden, etc.)
- **Verify:**
  ```bash
  export CASPER_API_KEY=<your-key>
  curl -s -H "Authorization: $CASPER_API_KEY" https://api.cspr.cloud/accounts | jq '.data | length'
  # Should return a number > 0
  ```
- **Why:** Required for backend event indexing + RPC proxy.

### 2.3 Generate Deployer Keypair

- [ ] **Action:** Generate an Ed25519 keypair for the deployer account.
- **Command:**
  ```bash
  mkdir -p ~/keys/meridian-deployer
  casper-client keygen -a ed25519 ~/keys/meridian-deployer
  chmod 600 ~/keys/meridian-deployer/secret_key.pem
  ```
- **Verify:**
  ```bash
  ls -la ~/keys/meridian-deployer/
  # Should show: public_key.pem, public_key_hex, secret_key.pem
  # secret_key.pem must have -rw------- (600) permissions
  cat ~/keys/meridian-deployer/public_key_hex
  # Should show a 66-char hex string starting with 02
  ```
- **Why:** Deployer account deploys all 5 smart contracts to testnet.
- **⚠️ SECURITY:** Never commit `secret_key.pem` to git. Add `~/keys/` to `.gitignore`.

### 2.4 Generate 3 Agent Keypairs

- [ ] **Action:** Generate Ed25519 keypairs for YieldAgent, ComplianceAgent, AuditAgent.
- **Command:**
  ```bash
  for agent in yield-agent compliance-agent audit-agent; do
    mkdir -p ~/keys/$agent
    casper-client keygen -a ed25519 ~/keys/$agent
    chmod 600 ~/keys/$agent/secret_key.pem
  done
  ```
- **Verify:**
  ```bash
  ls ~/keys/
  # Should show: meridian-deployer, yield-agent, compliance-agent, audit-agent
  for agent in yield-agent compliance-agent audit-agent; do
    echo "$agent public key: $(cat ~/keys/$agent/public_key_hex)"
  done
  ```
- **Why:** Each agent has its own keypair registered in the relevant smart contract.

### 2.5 Fund Deployer Wallet on Testnet

- [ ] **Action:** Fund the deployer wallet with at least 500 CSPR on testnet.
- **Steps:**
  1. Go to https://testnet.cspr.live/tools/faucet
  2. Enter your deployer public key (from `~/keys/meridian-deployer/public_key_hex`)
  3. Click "Claim"
  4. Receive ~75 CSPR
  5. Repeat every 24 hours until you have ≥ 500 CSPR (takes ~7 days)
  6. **OR:** If you have a funded mainnet account, transfer CSPR from mainnet to testnet (note: this is a one-way conversion; testnet CSPR has no value)
- **Alternative (faster):** Ask in Casper Discord (https://discord.gg/casperblockchain) for testnet CSPR. DevRel team often provides larger amounts for hackathon builders.
- **Verify:**
  ```bash
  casper-client get-account-info \
    --node-address https://node.cspr.cloud/rpc \
    --public-key $(cat ~/keys/meridian-deployer/public_key_hex) \
    | jq '.result.balance'
  # Should return a number ≥ 500000000000 (500 CSPR in motes)
  ```
- **Why:** Deployer needs CSPR to pay gas for contract deployment (~2.5 CSPR per deploy × 5 contracts = ~12.5 CSPR minimum, plus buffer for issuance transactions).

### 2.6 Fund Agent Wallets on Testnet

- [ ] **Action:** Transfer 50 CSPR each from deployer to each agent wallet.
- **Command (for each agent):**
  ```bash
  for agent in yield-agent compliance-agent audit-agent; do
    AGENT_PUBKEY=$(cat ~/keys/$agent/public_key_hex)
    casper-client make-transfer \
      --node-address https://node.cspr.cloud/rpc \
      --chain-name casper-test \
      --secret-key ~/keys/meridian-deployer/secret_key.pem \
      --from $(cat ~/keys/meridian-deployer/public_key_hex) \
      --to $AGENT_PUBKEY \
      --amount 50000000000 \
      --payment-amount 100000000 \
      --output /tmp/transfer-$agent.json
    casper-client sign-transaction \
      --secret-key ~/keys/meridian-deployer/secret_key.pem \
      --input /tmp/transfer-$agent.json \
      --output /tmp/signed-$agent.json
    casper-client send-transaction \
      --node-address https://node.cspr.cloud/rpc \
      --input /tmp/signed-$agent.json
    echo "Funded $agent with 50 CSPR"
  done
  ```
- **Verify:**
  ```bash
  for agent in yield-agent compliance-agent audit-agent; do
    AGENT_PUBKEY=$(cat ~/keys/$agent/public_key_hex)
    BALANCE=$(casper-client get-account-info \
      --node-address https://node.cspr.cloud/rpc \
      --public-key $AGENT_PUBKEY \
      | jq -r '.result.balance')
    echo "$agent balance: $BALANCE motes"
  done
  # Each should show ≥ 50000000000 (50 CSPR)
  ```
- **Why:** Each agent needs CSPR to pay gas for the transactions it submits (restake, revoke, audit submissions).

---

## 3. AI Provider Accounts

### 3.1 Create Anthropic Account + API Key

- [ ] **Action:** Sign up for Anthropic and create an API key.
- **Steps:**
  1. Go to https://console.anthropic.com
  2. Sign up (email + password)
  3. Verify email
  4. Add payment method (credit card — required for API access; $5 free credit covers development)
  5. Navigate to "API Keys"
  6. Click "Create Key"
  7. Name it "Meridian YieldAgent"
  8. Copy key (starts with `sk-ant-`)
  9. Save in password manager
- **Verify:**
  ```bash
  export ANTHROPIC_API_KEY=<your-key>
  curl -s https://api.anthropic.com/v1/models \
    -H "x-api-key: $ANTHROPIC_API_KEY" \
    -H "anthropic-version: 2023-06-01" \
    | jq '.data | length'
  # Should return a number > 0
  ```
- **Why:** Claude Sonnet 4.5 is the primary model for YieldAgent + fallback for ComplianceAgent.

### 3.2 Create OpenAI Account + API Key

- [ ] **Action:** Sign up for OpenAI and create an API key.
- **Steps:**
  1. Go to https://platform.openai.com
  2. Sign up
  3. Add payment method ($5 free credit covers development)
  4. Navigate to "API Keys"
  5. Click "Create new secret key"
  6. Name it "Meridian ComplianceAgent"
  7. Copy key (starts with `sk-`)
  8. Save in password manager
- **Verify:**
  ```bash
  export OPENAI_API_KEY=<your-key>
  curl -s https://api.openai.com/v1/models \
    -H "Authorization: Bearer $OPENAI_API_KEY" \
    | jq '.data | length'
  # Should return a number > 0
  ```
- **Why:** GPT-4o is the primary model for ComplianceAgent + fallback for YieldAgent.

### 3.3 Create Google AI Studio Account + API Key

- [ ] **Action:** Sign up for Google AI Studio and create an API key.
- **Steps:**
  1. Go to https://aistudio.google.com
  2. Sign in with Google account
  3. Navigate to "Get API key"
  4. Click "Create API key"
  5. Select or create a Google Cloud project
  6. Copy key (starts with `AIzaSy...`)
  7. Save in password manager
- **Verify:**
  ```bash
  export GOOGLE_API_KEY=<your-key>
  curl -s "https://generativelanguage.googleapis.com/v1/models?key=$GOOGLE_API_KEY" \
    | jq '.models | length'
  # Should return a number > 0
  ```
- **Why:** Gemini 2.5 Flash is the primary model for AuditAgent (long context for CEP-88 event streams).

---

## 4. Configure `.env` File

### 4.1 Copy `.env.example` to `.env`

- [ ] **Action:** After Phase 1 generates `.env.example`, copy it to `.env` and fill in all values.
- **Command:**
  ```bash
  cp .env.example .env
  # Edit .env with your editor of choice:
  nano .env  # or vim, code, etc.
  ```
- **Fill in every value** from the sources documented in `ENVIRONMENT_REQUIREMENTS.md`:
  - `CASPER_API_KEY` → from step 2.2
  - `MERIDIAN_DEPLOYER_PUBLIC_KEY` → from `~/keys/meridian-deployer/public_key_hex` (step 2.3)
  - `MERIDIAN_DEPLOYER_PRIVATE_KEY_PEM` → `/home/<you>/keys/meridian-deployer/secret_key.pem` (step 2.3)
  - `MERIDIAN_YIELD_AGENT_*` → from step 2.4
  - `MERIDIAN_COMPLIANCE_AGENT_*` → from step 2.4
  - `MERIDIAN_AUDIT_AGENT_*` → from step 2.4
  - `ANTHROPIC_API_KEY` → from step 3.1
  - `OPENAI_API_KEY` → from step 3.2
  - `GOOGLE_API_KEY` → from step 3.3
  - `DATABASE_URL` → from step 1.6
  - `REDIS_URL` → from step 1.7
  - Leave `NEXT_PUBLIC_MERIDIAN_CONTRACT_PACKAGE_HASH` and `X402_PAYMENT_TOKEN_CONTRACT_HASH` blank — these are set after Phase 4 deployment.

### 4.2 Verify `.env` Is in `.gitignore`

- [ ] **Action:** Confirm `.env` is in `.gitignore`.
- **Command:**
  ```bash
  grep -E "^\.env$" .gitignore
  # Should return: .env
  ```
- **Why:** Prevents accidental commit of secrets.

### 4.3 Run Verification Script

- [ ] **Action:** Run `./scripts/verify-env.sh` and confirm ALL checks pass.
- **Command:**
  ```bash
  ./scripts/verify-env.sh
  ```
- **Expected output:**
  ```
  === Meridian Environment Verification ===
  ...
  === Summary ===
  Passed: <number>
  Failed: 0
  
  ✅ ALL CHECKS PASSED. Ready to proceed.
  ```
- **If ANY check fails:** Fix the root cause (do NOT set placeholder values). Re-run until all pass.

---

## 5. Final Pre-Cursor Checklist

Before telling Cursor to start Phase 0, confirm:

- [ ] Rust 1.85+ installed with `wasm32-unknown-unknown` target (1.1)
- [ ] `just` v1.40.0+ installed (1.2)
- [ ] `cargo-odra` v0.1.7 installed (1.3)
- [ ] `casper-client` v5.0.1 installed (1.4)
- [ ] Node.js 20+ installed (1.5)
- [ ] PostgreSQL 15+ running and reachable (1.6)
- [ ] Redis 7+ running and reachable (1.7)
- [ ] Docker Desktop installed (1.8)
- [ ] Casper Wallet browser extension installed with seed phrase backed up (2.1)
- [ ] CSPR.cloud account created + API key saved (2.2)
- [ ] Deployer keypair generated + PEM file perms 600 (2.3)
- [ ] 3 agent keypairs generated + PEM files perms 600 (2.4)
- [ ] Deployer wallet funded with ≥ 500 CSPR on testnet (2.5)
- [ ] 3 agent wallets funded with ≥ 50 CSPR each on testnet (2.6)
- [ ] Anthropic API key created + saved (3.1)
- [ ] OpenAI API key created + saved (3.2)
- [ ] Google AI Studio API key created + saved (3.3)
- [ ] `.env` file created with all values filled in (4.1)
- [ ] `.env` is in `.gitignore` (4.2)
- [ ] `./scripts/verify-env.sh` passes ALL checks (4.3)

**Once all boxes are checked, you are ready to start Phase 0.**

Tell Cursor:
> "Read FINAL_PROMPT.md, ENVIRONMENT_REQUIREMENTS.md, and USER_ACTIONS.md. I have completed all user actions. Execute Phase 0."

---

## 6. Ongoing Human Actions (During Phases)

After Phase 0 begins, the human is required only for:

### 6.1 Phase Approvals

- [ ] **Action:** Review `PHASE_REPORT.md` after each phase.
- **Steps:**
  1. Read the report.
  2. Verify all acceptance criteria are met.
  3. Run any manual verification you want (e.g. open a testnet transaction hash on CSPR.live).
  4. Either approve (tell Cursor to proceed) or request changes.

### 6.2 Phase 4 (Testnet Deployment) — Optional Witness

- [ ] **Action:** Watch the contract deployments happen live on testnet.
- **Steps:**
  1. Open https://testnet.cspr.live in a browser.
  2. Search for your deployer public key.
  3. As Cursor runs `./scripts/deploy-testnet.sh`, watch each deployment transaction appear.
  4. Verify each contract hash appears on CSPR.live.

### 6.3 Phase 10 (Production QA) — Demo Video Recording

- [ ] **Action:** Record the 90-second demo video.
- **Steps:**
  1. Open the frontend in a browser.
  2. Connect your Casper Wallet.
  3. Follow the demo script in `docs/DEMO_SCRIPT.md`.
  4. Record screen + voiceover (QuickTime on macOS, OBS on Linux).
  5. Save as `demos/video/meridian-demo.mp4`.
  6. Upload to YouTube as unlisted.
  7. Optionally also upload to IPFS via Pinata or w3up.

### 6.4 Hackathon Submission

- [ ] **Action:** Submit the project to DoraHacks.
- **Steps:**
  1. Go to https://dorahacks.io/hackathon/casper-agentic-buildathon/buidl
  2. Find your project (or create new BUIDL)
  3. Update with:
     - GitHub repo URL (public)
     - Demo video URL (YouTube unlisted)
     - Testnet contract hashes (from `deployed/addresses.json`)
     - Project description (from `FINAL_PROMPT.md` Part 1 Executive Summary)
     - Tagline: "Where real-world assets earn real protocol yield."
  4. Submit.

---

## 7. What NOT To Do

- ❌ **DO NOT** commit `.env` to git.
- ❌ **DO NOT** commit any `secret_key.pem` files to git.
- ❌ **DO NOT** share API keys in chat, email, or screenshots.
- ❌ **DO NOT** skip the verification script — it exists to catch mistakes.
- ❌ **DO NOT** tell Cursor to "skip Phase N" or "fast-forward to Phase M".
- ❌ **DO NOT** approve a phase without reading `PHASE_REPORT.md`.
- ❌ **DO NOT** set environment variables to placeholder values like `changeme` or `TODO`.
- ❌ **DO NOT** use testnet CSPR as if it has value (it does not; testnet may be reset).
- ❌ **DO NOT** reuse testnet keypairs on mainnet.
- ❌ **DO NOT** deploy to mainnet during the hackathon (testnet only).

---

**END OF USER_ACTIONS.md**

**Once every checkbox above is checked, you are ready to invoke Cursor with the Phase 0 Prompt from FINAL_PROMPT.md Part 13.**
