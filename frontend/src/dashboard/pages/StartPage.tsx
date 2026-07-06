'use client'

import { useState, ReactElement } from 'react'
import { Box, Button, Paper, Stack, Step, StepLabel, Stepper, Typography } from '@mui/material'
import McpConnectionPanel from '@/components/McpConnectionPanel'
import CopyButton from '@/components/CopyButton'
import { MASTER_AGENT_PROMPT } from '@lib/mcp-catalog'
import PageHeader from '@/components/PageHeader'
import Link from 'next/link'

const STEPS = ['Install MCP', 'Connect Wallet', 'Discover Tools', 'Copy Master Prompt', 'Done']

export default function StartPage(): ReactElement {
  const [activeStep, setActiveStep] = useState(0)

  return (
    <Box>
      <PageHeader
        icon="mdi:rocket-launch-outline"
        eyebrow="Zero-Friction Onboarding"
        title="Start with MERIDIAN"
        description="Install MCP in Claude or Cursor, connect your wallet, discover 13 tools, and run your first agent workflow in minutes."
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
              Copy the MCP config below into Cursor or Claude Desktop settings. MERIDIAN uses
              Streamable HTTP — no local build required for judges.
            </Typography>
            <McpConnectionPanel />
          </Stack>
        )}

        {activeStep === 1 && (
          <Stack gap={2}>
            <Typography color="text.secondary">
              Connect Casper Wallet on testnet. You need CSPR for gas and staking (min 500 CSPR for
              native delegation).
            </Typography>
            <Button component={Link} href="/staking" variant="contained">
              Open Staking Page
            </Button>
          </Stack>
        )}

        {activeStep === 2 && (
          <Stack gap={2}>
            <Typography color="text.secondary">
              Ask your agent: &quot;List every MERIDIAN MCP tool and categorize read vs write.&quot;
            </Typography>
            <Button component={Link} href="/mcp" variant="contained">
              Open MCP Tools
            </Button>
            <Button component={Link} href="/playground" variant="outlined">
              Open AI Playground
            </Button>
          </Stack>
        )}

        {activeStep === 3 && (
          <Stack gap={2}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle1" color="common.white">
                Master Agent Prompt
              </Typography>
              <CopyButton text={MASTER_AGENT_PROMPT} label="Copy Master Prompt" />
            </Stack>
            <Box
              component="pre"
              sx={{
                p: 2,
                bgcolor: '#0a0a0a',
                borderRadius: 1,
                fontSize: 13,
                whiteSpace: 'pre-wrap',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              {MASTER_AGENT_PROMPT}
            </Box>
          </Stack>
        )}

        {activeStep === 4 && (
          <Stack gap={2}>
            <Typography color="success.main" fontWeight={700}>
              ✓ You are ready. Try: &quot;What is the current MRWA yield APY?&quot;
            </Typography>
            <Stack direction="row" gap={1} flexWrap="wrap">
              <Button component={Link} href="/prompts" variant="contained">
                Prompt Library
              </Button>
              <Button component={Link} href="/agents" variant="outlined">
                Agent Activity Center
              </Button>
              <Button component={Link} href="/playground" variant="outlined">
                Playground
              </Button>
            </Stack>
          </Stack>
        )}
      </Paper>
    </Box>
  )
}
