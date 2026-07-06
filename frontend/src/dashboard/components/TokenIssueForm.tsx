'use client'

import { useState, ReactElement } from 'react'
import { Stack, TextField, Button, Alert } from '@mui/material'
import FlowStepper from '@/components/FlowStepper'

const STEPS = [
  { label: 'Details', icon: 'mdi:form-textbox' },
  { label: 'Build via MCP', icon: 'mdi:wrench-outline' },
  { label: 'Sign & Submit', icon: 'mdi:pen' },
  { label: 'Confirmed', icon: 'mdi:check-decagram' },
]

export default function TokenIssueForm(): ReactElement {
  const [symbol, setSymbol] = useState('MRWA')
  const [initialSupply, setInitialSupply] = useState('1000000')
  const [error, setError] = useState<string | null>(null)

  const activeStep = 0

  const buildTransaction = () => {
    setError(
      'MRWA is already deployed as a fixed-supply token. There is no public issue/mint transaction to sign; use Transfer Token or Staking to create new on-chain activity.',
    )
  }

  return (
    <Stack gap={3}>
      <FlowStepper steps={STEPS} activeStep={activeStep} />
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
        <Button variant="contained" onClick={buildTransaction}>
          Token already deployed
        </Button>
      </Stack>
      <Alert severity="info">
        MRWA fixed supply was minted when the MeridianToken contract was deployed. This page no
        longer opens Casper Wallet for an invalid self-transfer issue template.
      </Alert>
      {error ? <Alert severity="warning">{error}</Alert> : null}
    </Stack>
  )
}
