# Example: delegate 500 CSPR via MCP

```bash
VALIDATOR=$(curl -sS -X POST https://meridian-frontend-kappa.vercel.app/api/mcp \
  -H 'Content-Type: application/json' \
  -d '{"tool":"list_validators","arguments":{"limit":1}}' | jq -r '.result.validators[0].public_key')

curl -sS -X POST https://meridian-frontend-kappa.vercel.app/api/mcp \
  -H 'Content-Type: application/json' \
  -d "{\"tool\":\"delegate_stake\",\"arguments\":{\"callerPublicKey\":\"YOUR_PUBLIC_KEY\",\"validator\":\"$VALIDATOR\",\"amount\":\"500000000000\"}}"
```

Sign the returned unsigned transaction in Casper Wallet at https://meridian-frontend-kappa.vercel.app/staking
