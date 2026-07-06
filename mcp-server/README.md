# MERIDIAN MCP Server

Production MCP server exposing **13 Casper-aware tools** over **stdio** and **Streamable HTTP**.

Primary users: **Claude Desktop**, **Claude Code**, and **Cursor Agent**.

## Tools

| Tool                    | Type  | Description                                   |
| ----------------------- | ----- | --------------------------------------------- |
| `get_token_info`        | read  | MRWA metadata + deployed addresses            |
| `get_yield_rate`        | read  | Current APY and total staked                  |
| `get_holder_yield`      | read  | Yield distribution history                    |
| `get_compliance_status` | read  | Compliance registry status                    |
| `list_validators`       | read  | Auction validators via RPC                    |
| `subscribe_audit`       | read  | Premium audit feed (402 without x402 payment) |
| `transfer_token`        | write | Unsigned MRWA transfer                        |
| `register_holder`       | write | Unsigned compliance registration              |
| `revoke_holder`         | write | Unsigned revocation (compliance officer)      |
| `delegate_stake`        | write | Native Casper delegation (min 500 CSPR)       |
| `deposit_to_vault`      | write | MERIDIAN StakingVault payable deposit         |
| `restake`               | write | Vault restake (VALIDATOR_CURATOR only)        |
| `distribute_rewards`    | write | Vault reward distribution                     |

Write tools are **non-custodial** — they return unsigned `TransactionV1` JSON for local signing (CSPR.click / Casper Wallet).

`issue_token` was removed: MRWA is fixed-supply at deployment.

## Run locally

```bash
pnpm --filter @meridian/casper-sdk run build
pnpm --filter @meridian/mcp-server run build

# HTTP (MCP Inspector / Claude Desktop remote)
MERIDIAN_MCP_TRANSPORT=http pnpm --filter @meridian/mcp-server start

# stdio (Claude Desktop local)
MERIDIAN_MCP_TRANSPORT=stdio pnpm --filter @meridian/mcp-server start:stdio
```

Endpoints (HTTP mode):

- `GET /health` — liveness + tool count
- `GET /metrics` — Prometheus
- `POST/GET/DELETE /mcp` — MCP Streamable HTTP

## Claude Desktop

```json
{
  "mcpServers": {
    "meridian": {
      "command": "pnpm",
      "args": ["--filter", "@meridian/mcp-server", "start:stdio"],
      "env": {
        "MERIDIAN_MCP_TRANSPORT": "stdio",
        "BACKEND_URL": "https://meridian-backend-ikx8.onrender.com",
        "MERIDIAN_API_KEY": "<your-key>"
      }
    }
  }
}
```

See `docs/claude-integration.md` and `MERIDIAN_PRODUCT_STORY.md`.

## Environment

See root `.env`: `MERIDIAN_MCP_PORT`, `BACKEND_URL`, `MERIDIAN_API_KEY`, `MERIDIAN_CONTRACTS_PATH=deployed/addresses.json`.
