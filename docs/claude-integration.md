# Claude Integration — MERIDIAN MCP

MERIDIAN is designed for **Claude Desktop** and **Claude Code** as primary users. The dashboard is only a visualizer.

Read `MERIDIAN_PRODUCT_STORY.md` first.

## Installation

### Claude Desktop (stdio — recommended for local dev)

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

### Claude Desktop (remote HTTP)

```json
{
  "mcpServers": {
    "meridian": {
      "url": "https://meridian-mcp-server-94q4.onrender.com/mcp",
      "transport": "streamable-http"
    }
  }
}
```

### Claude Code

```bash
cd MERIDIAN
pnpm install
pnpm --filter @meridian/casper-sdk build
pnpm --filter @meridian/mcp-server build
claude mcp add meridian --transport stdio -- pnpm --filter @meridian/mcp-server start:stdio
```

## Demo prompts

### Read-only (no wallet)

```
What is the current MRWA yield APY on Casper testnet?
```

```
List the top 5 Casper validators I can delegate to.
```

```
Check compliance status for account-hash-<holder>
```

### Write (wallet required)

```
Build an unsigned transaction to transfer 1000 MRWA to account-hash-<recipient>.
I will sign in Casper Wallet.
My public key is 01<...>
```

```
Delegate 500 CSPR (500000000000 motes) to validator 01<...>.
My public key is 01<...>
```

```
Register account-hash-<holder> as a compliant holder with attestation 00.
My public key is 01<...>
```

### x402 machine commerce

```
I need premium audit data. Walk me through the x402 payment for subscribe_audit.
```

## Conversation example

**User:** What is the yield right now?

**Claude:** Calls `get_yield_rate` → returns APY and total staked → answers in natural language. No wallet.

**User:** Stake 500 CSPR with the top validator.

**Claude:**

1. Calls `list_validators`
2. Calls `delegate_stake` with 500000000000 motes
3. Returns unsigned TransactionV1 JSON
4. User signs in Casper Wallet
5. Dashboard Agent Activity Center streams the trace

## Wallet signing

1. Claude returns unsigned transaction JSON from a write tool.
2. Open MERIDIAN dashboard → Agent Activity Center or MCP Tools page.
3. Paste/sign via CSPR.click or Casper Wallet extension.
4. Transaction broadcasts to Casper testnet.
5. Explorer: https://testnet.cspr.live

Private keys never leave the wallet. MERIDIAN MCP is non-custodial.

## Planner Agent

For multi-step objectives, use the backend Planner:

```bash
curl -X POST https://meridian-backend-ikx8.onrender.com/api/v1/planner/execute \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $MERIDIAN_API_KEY" \
  -d '{"objective":"What is the current yield APY?"}'
```

Or use the dashboard Agent Activity Center **Run Planner** button.

## Live URLs

| Service             | URL                                                         |
| ------------------- | ----------------------------------------------------------- |
| Frontend visualizer | https://meridian-frontend-kappa.vercel.app/dashboard/agents |
| MCP server          | https://meridian-mcp-server-94q4.onrender.com               |
| Backend             | https://meridian-backend-ikx8.onrender.com                  |
