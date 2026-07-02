# MERIDIAN Phase Reports

Progress reports for the MERIDIAN Casper smart contract stack.

**Last updated:** 2026-07-02 (Agent identity separation + 3-service Render)

---

## Deployment & identity reports

| Report                                                 | Description                                         |
| ------------------------------------------------------ | --------------------------------------------------- |
| [DEPLOYMENT_REPORT.md](./DEPLOYMENT_REPORT.md)         | Live Render stack, health checks, readiness score   |
| [AGENT_IDENTITY_REPORT.md](./AGENT_IDENTITY_REPORT.md) | Independent agent wallets, inline PEM, verification |

---

## Completed Phases

| Phase                         | Report                                       | Status   |  Readiness |
| ----------------------------- | -------------------------------------------- | -------- | ---------: |
| 1 — Environment               | [PHASE_1_REPORT.md](./PHASE_1_REPORT.md)     | Complete |    100/100 |
| 2 — Smart Contracts           | [PHASE_2_REPORT.md](./PHASE_2_REPORT.md)     | Complete |     92/100 |
| 3 — Contract Testing          | [PHASE_3_REPORT.md](./PHASE_3_REPORT.md)     | Complete |     97/100 |
| 4 — Testnet Deployment        | [PHASE_4_REPORT.md](./PHASE_4_REPORT.md)     | Complete |     95/100 |
| 4.5 — Production Hardening    | [PHASE_4_5_REPORT.md](./PHASE_4_5_REPORT.md) | Complete |     96/100 |
| 5 — Backend + Indexer         | [PHASE_5_REPORT.md](./PHASE_5_REPORT.md)     | Complete |     96/100 |
| 6 — AI Agents                 | [PHASE_6_REPORT.md](./PHASE_6_REPORT.md)     | Complete |     94/100 |
| 7 — MCP + x402                | [PHASE_7_REPORT.md](./PHASE_7_REPORT.md)     | Complete | **96/100** |
| 8 — E2E Integration           | [PHASE_8_REPORT.md](./PHASE_8_REPORT.md)     | Complete | **95/100** |
| 8.5 — Post-Funding Validation | [PHASE_8_5_REPORT.md](./PHASE_8_5_REPORT.md) | Complete | **95/100** |

---

## Current State (Post Phase 8.5)

### Wallet (live testnet)

- **Public key:** `0203d64d1b7f66f18c0abe9836df604c187797ddb962b9fc3396201c245f9de335a6`
- **Balance:** ~9,829 CSPR liquid
- **x402 settlements:** 100/100 verified on-chain

### Services (Render production — 3 active)

| Service                     | URL                                            |
| --------------------------- | ---------------------------------------------- |
| Backend (+ embedded agents) | https://meridian-backend-cu88.onrender.com     |
| x402 combined               | https://meridian-x402-facilitator.onrender.com |
| MCP Server                  | https://meridian-mcp-server-94q4.onrender.com  |

Local ports: Backend 3000, x402 3001, MCP 3002

### Evidence

- [x402_100_settlement_results.json](./x402_100_settlement_results.json) — 100 transaction hashes

---

## Go / No-Go

**GO for Phase 9 (Frontend)** — awaiting user approval.

---

## Quick commands

```bash
# Re-run full E2E
pnpm exec vitest run --config tests/e2e/vitest.config.ts

# 100 settlement validation
node x402-facilitator/scripts/validate-100-settlements.mjs

# Integration tests
./scripts/run-integration-tests.sh
```
