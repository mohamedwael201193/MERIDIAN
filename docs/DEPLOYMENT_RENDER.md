# Render Deployment — MERIDIAN Backend

**Updated:** 2026-06-28 (Phase 5)

## Services (`render.yaml`)

| Service | Type | Health check |
| --- | --- | --- |
| `meridian-backend` | Web | `GET /health` |
| `meridian-agents` | Worker | N/A (batch runner) |

## Build (dry-run verified locally)

```bash
pnpm install --frozen-lockfile
pnpm --filter @meridian/env run build
pnpm --filter @meridian/backend run build
cd backend && pnpm run migrate   # against Supabase DATABASE_URL
node backend/dist/main.js        # PORT=3000
```

## Environment (Render dashboard)

Mirror `.env` keys marked `sync: false` in `render.yaml`. Required:

- `DATABASE_URL` (Supabase pooler)
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- `CASPER_API_KEY`, `CASPER_RPC_URL`, `CASPER_SIDE_CAR_URL`
- `MERIDIAN_API_KEY`, `MERIDIAN_CONTRACTS_PATH=deployed/addresses.json`
- `CSPR_STREAMING_URL=wss://streaming.testnet.cspr.cloud`

## Verification checklist

- [ ] `GET https://<render-url>/health` → 200, `checks.postgres.ok=true`
- [ ] `GET https://<render-url>/ready` → 200
- [ ] `GET https://<render-url>/metrics` → Prometheus text
- [ ] `GET https://<render-url>/api/v1/tokens` + `X-API-Key` → 5 tokens
- [ ] Supabase `meridian_events` count > 0 after indexer backfill
- [ ] CSPR.cloud stream connected (check logs: `stream_connected`)

## Dry-run result (local)

| Check | Result |
| --- | --- |
| Build | PASS |
| Migrations (6) | PASS on Supabase |
| `/health` | 200 |
| `/metrics` | 200 |
| Indexer backfill | 6 events from live deployment txs |
| WebSocket stream | Connected to `streaming.testnet.cspr.cloud` |

## Rollback

Render dashboard → previous deploy. Database is forward-only migrations; no destructive rollback.
