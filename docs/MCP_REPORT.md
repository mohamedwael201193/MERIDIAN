# MCP Report

**MCP server:** `https://meridian-mcp-server-94q4.onrender.com`  
**Tools:** 13 (7 read + 6 write + subscribe_audit read with x402)

## Write tools

| Tool                 | MCP registered | Planner route | write-tool-invoker | Tx builder | Prod audit                                                         |
| -------------------- | -------------- | ------------- | ------------------ | ---------- | ------------------------------------------------------------------ |
| `delegate_stake`     | YES            | YES           | YES                | YES        | PASS                                                               |
| `deposit_to_vault`   | YES            | YES           | YES                | BLOCKED    | Requires Odra payable `__cargo_purse`; no unsigned deploy returned |
| `restake`            | YES            | YES           | YES                | YES        | PASS                                                               |
| `register_holder`    | YES            | YES (local)   | YES                | YES        | PASS local; requires contract owner signer                         |
| `revoke_holder`      | YES            | YES (local)   | YES                | YES        | FAIL (no route prod)                                               |
| `transfer_token`     | YES            | YES (local)   | YES                | YES        | FAIL (422 prod)                                                    |
| `distribute_rewards` | YES            | YES           | YES                | BLOCKED    | Requires YieldDistributor contract caller; no user-wallet deploy   |
| `issue_token`        | NO             | NO            | NO                 | NO         | NOT IMPLEMENTED                                                    |

## Read tools (verified)

- `get_token_info`
- `get_yield_rate`
- `get_holder_yield`
- `get_compliance_status`
- `list_validators`
- `subscribe_audit` (402 without x402 payment header)

## Planner vs MCP HTTP

The briefing agent calls **backend planner**, which invokes write tools **in-process** via `write-tool-invoker.ts` (loads same `TransactionBuilder` as MCP). This avoids an extra HTTP hop but produces identical unsigned transactions.

MCP HTTP path (direct tool call):

```
POST /api/v1/mcp/tools/:name  (frontend meridianApi.mcpTool)
  → MCP server write-tools handler
  → TransactionBuilder
```

Both paths must stay in sync — shared `mcp-server/dist/casper/tx-builder.js`.

## Health

```bash
curl -s https://meridian-mcp-server-94q4.onrender.com/health
```

Expected: 13 tools, healthy status.

## Fixes applied

1. `render.yaml` — build mcp-server before backend
2. `resolve-tx-builder.ts` — resilient module path resolution
3. `addresses.json` copied to `dist/deployed/` on build

## Required fixes

1. Deploy backend with planner register/transfer/revoke fixes
2. Implement Odra payable cargo-purse transaction support before enabling `deposit_to_vault`
3. Replace user-wallet `distribute_rewards` with a YieldDistributor/agent-signed execution path or remove it from writable templates
4. Add `issue_token` only if a future contract upgrade exposes a real mint/issue entrypoint

## Test commands

```bash
node scripts/test-write-tools.mjs
node scripts/execution-audit.mjs https://meridian-backend-ikx8.onrender.com
```
