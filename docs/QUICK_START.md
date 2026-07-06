# MERIDIAN Quick Start

**60 seconds to your first MCP call.**

## 1. Install MCP (Cursor)

Copy `config/cursor/mcp.json` into Cursor → Settings → MCP:

```json
{
  "mcpServers": {
    "meridian": {
      "url": "https://meridian-mcp-server-94q4.onrender.com/mcp"
    }
  }
}
```

## 2. Verify

```bash
curl -s https://meridian-mcp-server-94q4.onrender.com/health | jq '.tools'
# → 13
```

Or open **https://meridian-frontend-kappa.vercel.app/start**

## 3. First prompt (no wallet)

```
What is the current MRWA yield APY?
```

Agent calls `get_yield_rate` → answers from live indexer.

## 4. First write (wallet)

```
Delegate 500 CSPR to the first validator from list_validators.
My public key is YOUR_PUBLIC_KEY
```

Sign in Casper Wallet at **https://meridian-frontend-kappa.vercel.app/staking**

## 5. Watch the timeline

**https://meridian-frontend-kappa.vercel.app/agents** — SSE streams planner + MCP steps.

## Links

| Resource       | URL                       |
| -------------- | ------------------------- |
| Start page     | /start                    |
| Playground     | /playground               |
| Prompt library | /prompts                  |
| MCP tools      | /mcp                      |
| Product story  | MERIDIAN_PRODUCT_STORY.md |
