# Cursor MCP — paste into Cursor Settings → MCP

```json
{
  "mcpServers": {
    "meridian": {
      "url": "https://meridian-mcp-server-94q4.onrender.com/mcp"
    }
  }
}
```

Or copy from repo: `config/cursor/mcp.json`

Verify:

```bash
curl -s https://meridian-mcp-server-94q4.onrender.com/health | jq '.tools'
```

Expected: `13`
