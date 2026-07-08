# Cursor Integration — MERIDIAN MCP

Cursor Agent is a **primary user** of MERIDIAN. Configure MCP once, then drive the protocol in natural language.

## Quick setup

The repo includes `config/cursor/mcp.json` (copy to your Cursor MCP settings or symlink):

```json
{
  "mcpServers": {
    "meridian": {
      "url": "https://meridian-mcp-server-94q4.onrender.com/mcp"
    }
  }
}
```

Open MERIDIAN in Cursor → Agent mode → MCP tools appear automatically.

For local MCP:

```json
{
  "mcpServers": {
    "meridian": {
      "command": "pnpm",
      "args": ["--filter", "@meridian/mcp-server", "start:stdio"],
      "env": {
        "MERIDIAN_MCP_TRANSPORT": "stdio",
        "BACKEND_URL": "http://127.0.0.1:3000",
        "MERIDIAN_API_KEY": "dev-key"
      }
    }
  }
}
```

## Judge guide (60-second demo)

1. Open https://meridian-frontend-kappa.vercel.app/dashboard/agents
2. In Cursor Agent: **"Use MERIDIAN MCP. What is the current MRWA yield APY?"**
3. Agent calls `get_yield_rate` — answer appears, timeline updates via SSE
4. **"Delegate 500 CSPR to a validator. My public key is …"**
5. Agent calls `list_validators` then `delegate_stake`
6. Sign in Casper Wallet when prompted
7. Watch Agent Activity Center for wallet → broadcast → indexer events

## Demo prompts

| Prompt                   | Expected tool            | Wallet?       |
| ------------------------ | ------------------------ | ------------- |
| Current APY?             | `get_yield_rate`         | No            |
| List validators          | `list_validators`        | No            |
| Compliance for account X | `get_compliance_status`  | No            |
| Transfer MRWA to Alice   | `transfer_token`         | Yes           |
| Delegate 500 CSPR        | `delegate_stake`         | Yes           |
| Register holder          | `register_holder`        | Yes           |
| Premium audit            | `subscribe_audit` + x402 | Yes (payment) |

## Tool transcript example

```
User: Delegate 500 CSPR

Cursor Agent:
  → get_yield_rate (read) — context
  → list_validators (read) — pick validator
  → delegate_stake (write) — unsigned tx returned

User signs wallet → tx hash → dashboard timeline updates
```

## Installation checklist

```bash
git clone https://github.com/mohamedwael201193/MERIDIAN.git
cd MERIDIAN
pnpm install
pnpm --filter @meridian/casper-sdk build
pnpm --filter @meridian/mcp-server build
```

Connect Casper Wallet on testnet with ≥500 CSPR for staking demos.

## References

- Product story: `MERIDIAN_PRODUCT_STORY.md`
- Claude setup: `docs/claude-integration.md`
- CSPR.click: https://docs.cspr.click/
- CSPR.cloud: https://docs.cspr.cloud/
