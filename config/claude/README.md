# Claude Desktop MCP — add to `claude_desktop_config.json`

Copy `config/claude/claude_desktop_config.snippet.json` under `mcpServers`.

Local stdio (developers):

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
        "MERIDIAN_API_KEY": "your-key"
      }
    }
  }
}
```

Verify: ask Claude "What is the current MRWA yield APY?" — should call `get_yield_rate` without wallet.
