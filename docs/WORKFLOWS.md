# MERIDIAN Workflows

## Read-first workflow

```
Objective → Planner → get_* read tools → answer (no wallet)
```

Example: APY, validators, compliance status.

## Write workflow

```
Objective → Planner → read preflight → write tool → unsigned tx → wallet → RPC → indexer → timeline
```

Example: delegate_stake, transfer_token, register_holder.

## x402 workflow

```
subscribe_audit → 402 → wallet payment → verify → settle → premium data
```

## Judge demo (5 min)

1. Read APY (`get_yield_rate`)
2. List validators (`list_validators`)
3. Delegate 500 CSPR (`delegate_stake` + wallet)
4. x402 audit payment (`subscribe_audit`)
5. Watch **/agents** timeline

## Planner API

```bash
curl -X POST https://meridian-backend-ikx8.onrender.com/api/v1/planner/execute \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $MERIDIAN_API_KEY" \
  -d '{"objective":"What is the current MRWA yield APY?"}'
```

## Playground

**https://meridian-frontend-kappa.vercel.app/playground** — natural language + direct tool invoke + SSE.
