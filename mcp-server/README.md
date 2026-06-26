# MERIDIAN MCP Server

Production MCP server exposing 12 Casper-aware tools over **stdio** and **Streamable HTTP**.

## Tools

| Tool | Type | Description |
| --- | --- | --- |
| `get_token_info` | read | Token metadata from backend index |
| `get_yield_rate` | read | Current yield rate |
| `get_holder_yield` | read | Holder-specific yield |
| `get_compliance_status` | read | Compliance registry status |
| `list_validators` | read | Auction validators via RPC |
| `subscribe_audit` | read | Audit feed (402 without x402 payment header) |
| `issue_token` | write | Unsigned TransactionV1 template |
| `transfer_token` | write | Unsigned MRWA transfer |
| `register_holder` | write | Unsigned compliance registration |
| `revoke_holder` | write | Unsigned holder revocation |
| `restake` | write | Unsigned vault restake |
| `distribute_rewards` | write | Unsigned `distribute_rewards` call |

Write tools are **non-custodial** — they return unsigned `TransactionV1` JSON for local signing (CSPR.click / casper-client).

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

- `GET /health` — liveness
- `GET /metrics` — Prometheus
- `POST /GET/DELETE /mcp` — MCP Streamable HTTP

## MCP Inspector

```bash
npx @modelcontextprotocol/inspector
# Connect to http://127.0.0.1:3002/mcp
```

## Environment

See root `.env`: `MERIDIAN_MCP_PORT`, `BACKEND_URL`, `MERIDIAN_API_KEY`, `MERIDIAN_CONTRACTS_PATH=deployed/addresses.json`.
