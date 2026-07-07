# MERIDIAN MCP Integration Guide

**Version:** 1.0  
**Date:** July 7, 2026  
**MCP server (production):** `https://meridian-mcp-server-94q4.onrender.com/mcp`  
**Health endpoint:** `https://meridian-mcp-server-94q4.onrender.com/health`  
**Backend dependency:** `https://meridian-backend-ikx8.onrender.com`

---

## Architecture

```
AI Client (Cursor / Claude / VS Code)
        │  MCP (HTTP or stdio)
        ▼
MERIDIAN MCP Server (13 tools)
        │  REST + API key
        ▼
MERIDIAN Backend (indexer, compliance, planner)
        │  RPC + contracts
        ▼
Casper Testnet
```

The MCP server exposes **6 read tools** and **7 write tools**. Write tools return **unsigned** `TransactionV1` payloads; the user's Casper Wallet signs and broadcasts. The backend Planner API uses the same tx-builder via `backend/src/planner/resolve-tx-builder.ts`.

---

## Tool Catalog

### Read tools (no wallet)

| Tool                    | Description                                       | Source file                          |
| ----------------------- | ------------------------------------------------- | ------------------------------------ |
| `get_token_info`        | MRWA metadata, deployed addresses, indexed supply | `mcp-server/src/tools/read-tools.ts` |
| `get_yield_rate`        | Estimated APY and total staked CSPR               | same                                 |
| `get_holder_yield`      | Global yield distribution history                 | same                                 |
| `get_compliance_status` | ERC-3643 holder registry status                   | same                                 |
| `list_validators`       | Active Casper auction validators                  | same                                 |
| `subscribe_audit`       | Premium audit summaries (x402 gated)              | same                                 |

### Write tools (wallet signature required)

| Tool                 | Description                      | Min constraints                     |
| -------------------- | -------------------------------- | ----------------------------------- |
| `transfer_token`     | MRWA transfer                    | Valid caller public key             |
| `register_holder`    | Compliance registry registration | Attestation bytes                   |
| `revoke_holder`      | Revoke holder                    | Compliance officer role on-chain    |
| `delegate_stake`     | Native CSPR delegation           | ≥ 500 CSPR (`MIN_DELEGATION_MOTES`) |
| `deposit_to_vault`   | StakingVault deposit             | Payable amount                      |
| `restake`            | Vault restake between validators | Curator role                        |
| `distribute_rewards` | Vault yield distribution         | Vault operator role                 |

**Live verification (2026-07-07):** Health reports `"tools":13` with all names listed above.

---

## Cursor Setup

### Option A — One-click (recommended)

1. Open **`https://meridian-frontend-kappa.vercel.app/start`**
2. Complete wizard step 2 or click **Copy Cursor** on the connection panel
3. Paste into **Cursor Settings → MCP → Add server**

**Repo config file:** `config/cursor/mcp.json`

```json
{
  "mcpServers": {
    "meridian": {
      "url": "https://meridian-mcp-server-94q4.onrender.com/mcp"
    }
  }
}
```

### Option B — Merge into existing config

If Cursor Agent has filesystem access:

```
Merge config/cursor/mcp.json into ~/.cursor/mcp.json without removing existing servers.
```

Manual path: `~/.cursor/mcp.json` (Linux/macOS) or `%APPDATA%\Cursor\User\globalStorage\cursor.mcp\mcp.json` (Windows — verify for your Cursor version).

### Option C — Local stdio (developers)

```bash
cd /path/to/MERIDIAN
pnpm install
pnpm --filter @meridian/casper-sdk build
pnpm --filter @meridian/mcp-server build
MERIDIAN_MCP_TRANSPORT=stdio pnpm --filter @meridian/mcp-server start:stdio
```

Cursor MCP config (stdio):

```json
{
  "mcpServers": {
    "meridian": {
      "command": "pnpm",
      "args": ["--filter", "@meridian/mcp-server", "start:stdio"],
      "cwd": "/path/to/MERIDIAN",
      "env": {
        "MERIDIAN_MCP_TRANSPORT": "stdio",
        "BACKEND_URL": "https://meridian-backend-ikx8.onrender.com",
        "MERIDIAN_API_KEY": "your-api-key",
        "MERIDIAN_CONTRACTS_PATH": "deployed/addresses.json"
      }
    }
  }
}
```

### Verify in Cursor Agent

Prompt:

```
List every MERIDIAN MCP tool. Categorize read vs write.
```

Expected: 13 tools, 6 read / 7 write.

**Reference:** `docs/CURSOR_SETUP.md`, `docs/cursor-integration.md`

---

## Claude Desktop Setup

### HTTP (recommended for remote/demo)

Add to `claude_desktop_config.json` under `mcpServers`:

```json
"meridian": {
  "url": "https://meridian-mcp-server-94q4.onrender.com/mcp",
  "transport": "streamable-http"
}
```

**Snippet file:** `config/claude/claude_desktop_config.snippet.json`

### Claude Code (CLI)

```bash
claude mcp add meridian --transport http --url https://meridian-mcp-server-94q4.onrender.com/mcp
```

### Local stdio (development)

```json
{
  "mcpServers": {
    "meridian": {
      "command": "pnpm",
      "args": ["--filter", "@meridian/mcp-server", "start:stdio"],
      "cwd": "/path/to/MERIDIAN",
      "env": {
        "MERIDIAN_MCP_TRANSPORT": "stdio",
        "BACKEND_URL": "https://meridian-backend-ikx8.onrender.com",
        "MERIDIAN_API_KEY": "your-api-key"
      }
    }
  }
}
```

### First prompts

| Type  | Example                                                         |
| ----- | --------------------------------------------------------------- |
| Read  | `What is the current MRWA yield APY?`                           |
| Read  | `List the top 5 Casper validators I can delegate to.`           |
| Write | `Delegate 500 CSPR to validator 01.... My public key is 01....` |

**Reference:** `docs/CLAUDE_SETUP.md`, `docs/claude-integration.md`

---

## VS Code Setup

VS Code supports MCP via compatible extensions (e.g. MCP extension pack). Use the same HTTP URL as Cursor/Claude:

| Field       | Value                                               |
| ----------- | --------------------------------------------------- |
| Server name | `meridian`                                          |
| Transport   | HTTP / SSE (per extension)                          |
| URL         | `https://meridian-mcp-server-94q4.onrender.com/mcp` |

Steps:

1. Install an MCP-compatible extension in VS Code
2. Add server with URL above
3. Open MERIDIAN workspace or any folder
4. Run verification prompt: `List MERIDIAN MCP tools`

For local development, use stdio command from Cursor Option C.

Wizard step 1 includes **VS Code (MCP extension)** as a client choice; step 2 uses Cursor copy UI as fallback (`SetupWizard.tsx` line 175).

---

## Environment Variables (MCP Server)

| Variable                  | Production value                          | Required              |
| ------------------------- | ----------------------------------------- | --------------------- |
| `MERIDIAN_MCP_TRANSPORT`  | `http`                                    | Yes                   |
| `MERIDIAN_MCP_HOST`       | `0.0.0.0`                                 | Yes                   |
| `BACKEND_URL`             | Backend Render URL                        | Yes                   |
| `MERIDIAN_API_KEY`        | Shared secret                             | Yes                   |
| `CASPER_RPC_URL`          | `https://node.testnet.casper.network/rpc` | Yes                   |
| `CASPER_CHAIN_NAME`       | `casper-test`                             | Yes                   |
| `MERIDIAN_CONTRACTS_PATH` | `deployed/addresses.json`                 | Yes                   |
| `DATABASE_URL`            | Supabase                                  | For indexer reads     |
| `X402_FACILITATOR_URL`    | x402 service                              | For `subscribe_audit` |

Full list: `render.yaml` meridian-mcp-server service envVars.

---

## Frontend Proxy

The Next.js app proxies MCP health for browser-side verification:

| Route                 | Purpose                                                                                    |
| --------------------- | ------------------------------------------------------------------------------------------ |
| `GET /api/mcp/health` | Used by `useMcpHealth`, Setup wizard step 4                                                |
| MCP write builder     | `frontend/lib/server/mcp-write-builder.ts` requires `mcp-server/dist/casper/tx-builder.js` |

---

## Troubleshooting

| Symptom                                         | Cause                            | Fix                                             |
| ----------------------------------------------- | -------------------------------- | ----------------------------------------------- |
| 0 tools on health                               | MCP server down or build failed  | Check Render logs; redeploy mcp-server service  |
| Planner MODULE_NOT_FOUND                        | Backend missing mcp-server build | Redeploy with fixed `render.yaml` (see BUG-001) |
| Write tool returns unsigned tx but wallet fails | Wrong public key format          | Use `01...` Ed25519 key from Casper Wallet      |
| `subscribe_audit` 402                           | x402 payment required            | Pay via facilitator, retry with `paymentHeader` |
| Stale yield data                                | Backend indexer lag              | See `/health` `indexer_lag`; not MCP fault      |
| Cold start timeout                              | Render free tier                 | Retry after 30–60s                              |

---

## Security Notes

- Never commit `MERIDIAN_API_KEY` or agent private keys
- MCP write tools are non-custodial — they never hold private keys
- Rate limiting on backend API (`@fastify/rate-limit`)
- x402 audit path enforces payment before premium data

---

## Related Documents

- `docs/ONBOARDING_FLOW.md` — 7-step wizard using this integration
- `docs/AGENT_EXPERIENCE_SPEC.md` — Planner pipeline vs direct MCP
- `docs/BUG_FIX_REPORT.md` — tx-builder deployment fix
- `docs/ENVIRONMENT_REQUIREMENTS.md` — full env reference
