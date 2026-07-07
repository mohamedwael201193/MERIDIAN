'use client'

import { useState, ReactElement } from 'react'
import { Box, Button, Paper, Stack, Step, StepLabel, Stepper, Typography } from '@mui/material'
import AgentInstaller from '@/components/AgentInstaller'
import PageHeader from '@/components/PageHeader'
import Link from 'next/link'

const STEPS = ['Install MERIDIAN', 'Connect Wallet', 'Agent Ready', 'First Mission']

export default function StartPage(): ReactElement {
  const [activeStep, setActiveStep] = useState(0)

  return (
    <Box>
      <PageHeader
        icon="mdi:rocket-launch-outline"
        eyebrow="Zero Friction"
        title="Install MERIDIAN"
        description="Open MERIDIAN → Install → Connect Wallet → Agent Ready → Ask in natural language. No manual exploration required."
      />

      <Paper sx={{ p: 3, mb: 3 }}>
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 3 }}>
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Stack direction="row" gap={1} flexWrap="wrap" mb={3}>
          {STEPS.map((_, i) => (
            <Button
              key={i}
              size="small"
              variant={activeStep === i ? 'contained' : 'outlined'}
              onClick={() => setActiveStep(i)}
            >
              Step {i + 1}
            </Button>
          ))}
        </Stack>

        {activeStep === 0 && (
          <Stack gap={2}>
            <Typography color="text.secondary">
              Install MCP in Cursor or Claude Desktop, verify connectivity, and add the MERIDIAN
              Skill. Automatic file writes are blocked by OS security — we guide you through it.
            </Typography>
            <AgentInstaller />
          </Stack>
        )}

        {activeStep === 1 && (
          <Stack gap={2}>
            <Typography color="text.secondary">
              Connect Casper Wallet on testnet. Write missions require approval only when necessary
              (delegate, transfer, register).
            </Typography>
            <Button component={Link} href="/agent" variant="contained">
              Open Agent Console
            </Button>
          </Stack>
        )}

        {activeStep === 2 && (
          <Stack gap={2}>
            <Typography color="success.main" fontWeight={700}>
              ✓ Agent Ready — planner, MCP, and skill are configured.
            </Typography>
            <Typography color="text.secondary">
              Install a template from the marketplace or run a mission from the library.
            </Typography>
            <Stack direction="row" gap={1} flexWrap="wrap">
              <Button component={Link} href="/marketplace" variant="contained">
                Marketplace
              </Button>
              <Button component={Link} href="/missions" variant="outlined">
                Mission Library
              </Button>
            </Stack>
          </Stack>
        )}

        {activeStep === 3 && (
          <Stack gap={2}>
            <Typography color="text.secondary">
              Try: &quot;What is the current MRWA yield APY?&quot; — read-only, no wallet. Then:
              &quot;Delegate 500 CSPR to the best validator&quot; — wallet approval when needed.
            </Typography>
            <Button component={Link} href="/agent" variant="contained" size="large">
              Run First Mission
            </Button>
            <Button component={Link} href="/agents" variant="text">
              Watch timeline visualization
            </Button>
          </Stack>
        )}
      </Paper>
    </Box>
  )
}
