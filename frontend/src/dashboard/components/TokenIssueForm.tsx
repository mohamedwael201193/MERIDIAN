'use client'

import { useState, ReactElement } from 'react'
import { Stack, TextField, Button, Alert, Typography } from '@mui/material'

export default function TokenIssueForm(): ReactElement {
  const [symbol, setSymbol] = useState('MRWA')
  const [initialSupply, setInitialSupply] = useState('1000000')
  const [error, setError] = useState<string | null>(null)

  const buildTransaction = () => {
    setError(
      'No unsigned deploy was created. The deployed MeridianToken package has no public issue or mint entrypoint.',
    )
  }

  return (
    <Stack gap={3}>
      <Alert severity="warning">
        Token issuance is not executable on the current deployed contract. MERIDIAN will not open a
        wallet popup or display a confirmation for a transaction that cannot exist.
      </Alert>
      <TextField
        label="Symbol"
        value={symbol}
        onChange={(e) => setSymbol(e.target.value)}
        disabled
      />
      <TextField
        label="Initial supply (whole units)"
        value={initialSupply}
        onChange={(e) => setInitialSupply(e.target.value)}
        disabled
      />
      <Stack direction="row" gap={2}>
        <Button variant="outlined" color="warning" onClick={buildTransaction}>
          Explain why issuance is unavailable
        </Button>
      </Stack>
      <Typography variant="body2" color="text.secondary">
        Fixed supply was minted at deployment. Use Transfer Token or Staking for live on-chain
        activity, or upgrade the smart contract before exposing a real issue flow.
      </Typography>
      {error ? <Alert severity="warning">{error}</Alert> : null}
    </Stack>
  )
}
