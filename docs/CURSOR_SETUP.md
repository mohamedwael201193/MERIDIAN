# Cursor Setup

See also `config/cursor/README.md`.

## One-click config

Repo file: **`config/cursor/mcp.json`**

## UI setup

1. Open **https://meridian-frontend-kappa.vercel.app/start**
2. Click **Copy Cursor** on the connection panel
3. Paste into Cursor Settings → MCP → Add server

## Verify in Cursor Agent

```
List every MERIDIAN MCP tool. Categorize read vs write.
```

## Automatic merge (Cursor Agent with file access)

If the agent can write to your home directory:

```
Merge config/cursor/mcp.json into ~/.cursor/mcp.json without removing existing servers.
```

If automatic install is blocked, the Start page generates the exact JSON — copy manually.

## Local MCP (developers)

```bash
pnpm --filter @meridian/casper-sdk build
pnpm --filter @meridian/mcp-server build
MERIDIAN_MCP_TRANSPORT=stdio pnpm --filter @meridian/mcp-server start:stdio
```

Point Cursor to stdio command instead of URL.

## Judge path

Start → Playground → delegate 500 CSPR → Agent Activity Center
