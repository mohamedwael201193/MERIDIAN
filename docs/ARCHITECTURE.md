# MERIDIAN Architecture (Cloud-First)

## Overview

MERIDIAN is an institutional RWA platform on Casper Testnet with native staking yield, compliance enforcement, AI-assisted operations, MCP agent access, and x402 micropayments.

## Infrastructure

| Component             | Provider            | Purpose                         |
| --------------------- | ------------------- | ------------------------------- |
| Backend API + indexer | Render              | Host Node.js services           |
| Database              | Supabase PostgreSQL | Event index, query model        |
| Cache / queue         | Upstash Redis       | Agent coordination, rate limits |
| Blockchain            | Casper Testnet      | Smart contracts, TransactionV1  |
| RPC + events          | CSPR.cloud          | JSON-RPC + REST/SSE             |
| AI                    | OpenAI              | Primary agent reasoning         |
| Frontend (deferred)   | Vercel              | dApp UI                         |

## No Local Infrastructure

MERIDIAN does **not** use Docker, local PostgreSQL, or local Redis. All persistence and cache layers are cloud-managed.

## Repository Layout

- `contracts/` — Odra smart contracts (Phase 2+)
- `backend/` — Fastify API + indexer (Phase 5+)
- `agents/` — AI agents (Phase 6+)
- `mcp-server/` — MCP tools (Phase 7+)
- `packages/meridian-env/` — Zod environment validation
- `scripts/` — Verification and deployment scripts

## Data Flow

1. Contracts emit CEP-88 events on Casper Testnet.
2. CSPR.cloud streams events to the backend indexer on Render.
3. Indexer writes to Supabase PostgreSQL.
4. API serves indexed data; agents read structured state.
5. Agents coordinate via Upstash Redis and call OpenAI.
6. MCP exposes non-custodial tools; x402 handles paid access.

## Security

- Secrets in Render env vars and local `.env` only.
- PEM files gitignored, mode 600.
- MCP write tools return unsigned TransactionV1 only.
- No secrets in logs or CI output.
