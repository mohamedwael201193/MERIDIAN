# Claude Setup

Config snippet: **`config/claude/claude_desktop_config.snippet.json`**

## Claude Desktop (HTTP — recommended for judges)

Add under `mcpServers` in `claude_desktop_config.json`:

```json
"meridian": {
  "url": "https://meridian-mcp-server-94q4.onrender.com/mcp",
  "transport": "streamable-http"
}
```

## Claude Code

```bash
claude mcp add meridian --transport http --url https://meridian-mcp-server-94q4.onrender.com/mcp
```

## First prompts

**Read:** `What is the current MRWA yield APY?`

**Write:** `Delegate 500 CSPR. My public key is 01...`

## Master prompt

Copy from **https://meridian-frontend-kappa.vercel.app/prompts** or `frontend/src/lib/mcp-catalog.ts` → `MASTER_AGENT_PROMPT`.

## Verify

Claude should discover 13 tools and call `get_yield_rate` without requesting wallet for read-only questions.
