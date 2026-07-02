# MERIDIAN Agent Identity & Secrets Model

**Status:** Production (2026-07-02)  
**Scope:** Yield, Compliance, and Audit agents — independent Casper testnet wallets

---

## Overview

Each AI agent has its **own blockchain identity**. Agent private keys are **never shared** with the deployer wallet or with each other.

| Role                 | Wallet purpose                       | Signs                                                    |
| -------------------- | ------------------------------------ | -------------------------------------------------------- |
| **Deployer**         | Contract deployment, x402 settlement | x402 `/settle` native transfers only                     |
| **Yield Agent**      | Yield decisions + attestations       | Decision attestations; future on-chain restake proposals |
| **Compliance Agent** | Screening decisions + attestations   | Decision attestations                                    |
| **Audit Agent**      | Review decisions + attestations      | Decision attestations                                    |

---

## Environment variables (per agent)

Each agent requires **three** public identity fields plus **one** inline PEM:

| Agent      | Public key                             | Account hash                             | Inline PEM                                  |
| ---------- | -------------------------------------- | ---------------------------------------- | ------------------------------------------- |
| Yield      | `MERIDIAN_YIELD_AGENT_PUBLIC_KEY`      | `MERIDIAN_YIELD_AGENT_ACCOUNT_HASH`      | `MERIDIAN_YIELD_AGENT_PRIVATE_KEY_PEM`      |
| Compliance | `MERIDIAN_COMPLIANCE_AGENT_PUBLIC_KEY` | `MERIDIAN_COMPLIANCE_AGENT_ACCOUNT_HASH` | `MERIDIAN_COMPLIANCE_AGENT_PRIVATE_KEY_PEM` |
| Audit      | `MERIDIAN_AUDIT_AGENT_PUBLIC_KEY`      | `MERIDIAN_AUDIT_AGENT_ACCOUNT_HASH`      | `MERIDIAN_AUDIT_AGENT_PRIVATE_KEY_PEM`      |

Deployer (x402 / deployment only — **not used by agents**):

| Field        | Variable                            |
| ------------ | ----------------------------------- |
| Public key   | `MERIDIAN_DEPLOYER_PUBLIC_KEY`      |
| Account hash | `MERIDIAN_DEPLOYER_ACCOUNT_HASH`    |
| Inline PEM   | `MERIDIAN_DEPLOYER_PRIVATE_KEY_PEM` |

---

## Inline PEM format (local + Render)

**File paths are rejected at runtime.** All `*_PRIVATE_KEY_PEM` values must be **inline PEM strings** in `.env` / Render env vars:

```
MERIDIAN_YIELD_AGENT_PRIVATE_KEY_PEM=-----BEGIN EC PRIVATE KEY-----\nMIGk...\n-----END EC PRIVATE KEY-----\n
```

- Use `\n` escapes on a **single line** (required for Render API uploads).
- Never commit `.env` or PEM files (see `.gitignore`).
- Migrate from legacy file paths: `node scripts/inline-pem-env.mjs`

**Removed:** `ODRA_CASPER_LIVENET_SECRET_KEY_PATH` — use `MERIDIAN_DEPLOYER_PRIVATE_KEY_PEM` inline only.

---

## Permissions & limits

Defined in `packages/meridian-env/src/agent-identity.ts`:

| Agent      | Permissions                                             | Rate limit | Amount limit                   |
| ---------- | ------------------------------------------------------- | ---------- | ------------------------------ |
| Yield      | `read_yield`, `propose_decision`, `sign_attestation`    | 60/min     | 10T motes max restake proposal |
| Compliance | `read_compliance`, `screen_account`, `sign_attestation` | 120/min    | N/A                            |
| Audit      | `read_audit`, `review_decisions`, `sign_attestation`    | 60/min     | N/A                            |

---

## Code modules

| Module              | Path                                          | Role                                     |
| ------------------- | --------------------------------------------- | ---------------------------------------- |
| Inline PEM resolver | `packages/meridian-env/src/pem.ts`            | Rejects file paths                       |
| Agent config        | `packages/meridian-env/src/agent-identity.ts` | Roles, limits, separation checks         |
| Key load + sign     | `packages/meridian-casper-sdk/src/wallet.ts`  | PEM parse, verify pubkey/hash            |
| Agent wallet        | `agents/shared/src/agent-wallet.ts`           | `loadAgentWallet()`, `signAttestation()` |
| Decision POST       | `agents/shared/src/decision-poster.ts`        | Signed decisions to backend              |

---

## Decision attestations

When agents POST to `/api/v1/decisions`, the body includes:

```json
{
  "agentName": "yield",
  "decisionHash": "...",
  "decisionType": "yield_evaluation",
  "payload": {},
  "attestation": {
    "agent": "yield",
    "publicKey": "0202...",
    "accountHash": "account-hash-...",
    "digest": "<sha256 hex>",
    "signature": "<hex>"
  }
}
```

Each agent signs with **its own** private key. The deployer key is never loaded in agent processes.

---

## Verification

```bash
node scripts/inline-pem-env.mjs      # one-time: paths → inline in .env
node scripts/verify-agent-identity.mjs  # wallet + signature checks (no secret output)
bash scripts/verify-env.sh           # inline PEM presence checks
pnpm verify:agent-identity           # npm script alias
```

---

## Render env placement

| Service               | Agent private keys                    | Deployer private key |
| --------------------- | ------------------------------------- | -------------------- |
| `meridian-backend`    | ✅ All 3 agent PEMs (embedded agents) | ❌                   |
| `meridian-x402`       | ❌                                    | ✅ Deployer PEM only |
| `meridian-mcp-server` | ❌                                    | ❌                   |

Sync script: `node scripts/render-optimize.mjs` (MERIDIAN services only).

---

## Security rules

1. Never share deployer PEM with any agent env var.
2. Never commit `.env`, `*.pem`, `keys/`, or root `Account *_secret_key.pem`.
3. Frontend and MCP write tools: user signs via CSPR.click — **no agent or deployer keys in browser**.
4. x402 settlement uses deployer only — agents do not settle x402 payments.
