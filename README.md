# MERIDIAN

Casper-native RWA platform with native staking yield, AI agents, MCP tooling, and x402 micropayments on **Casper testnet**.

## Status

Phases 1–8.5 complete. Live contracts deployed. Backend, agents, MCP, and x402 facilitator validated on testnet.

## Documentation

| Document | Location |
| --- | --- |
| Execution plan | [docs/PROJECT_EXECUTION_PLAN.md](docs/PROJECT_EXECUTION_PLAN.md) |
| Architecture | [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) |
| Phase reports | [docs/reports/README.md](docs/reports/README.md) |
| Environment setup | [docs/ENVIRONMENT_REQUIREMENTS.md](docs/ENVIRONMENT_REQUIREMENTS.md) |
| Casper guides | [docs/CASPER_PROTOCOL_BIBLE.md](docs/CASPER_PROTOCOL_BIBLE.md) |

## Quick start

```bash
cp .env.example .env   # fill in secrets locally — never commit .env
pnpm install
pnpm --filter @meridian/backend run migrate
pnpm --filter @meridian/backend start
```

## Services (local)

| Service | Port |
| --- | --- |
| Backend | 3000 |
| x402 Facilitator | 3001 |
| MCP Server | 3002 |
| x402 Resource | 3003 |

## Stack

- **Contracts:** Odra 2.8.2 on Casper testnet
- **Backend:** Fastify + Supabase + CSPR.cloud indexer
- **Agents:** Yield, Compliance, Audit (multi-provider LLM)
- **MCP:** 12 tools (stdio + HTTP)
- **x402:** Native CSPR facilitator

## License

Apache 2.0
