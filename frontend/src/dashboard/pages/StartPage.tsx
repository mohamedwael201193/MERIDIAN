'use client'

import { useState, ReactElement } from 'react'
import { Box, Button, LinearProgress, Paper, Stack, Typography, keyframes } from '@mui/material'
import AgentInstaller from '@/components/AgentInstaller'
import Link from 'next/link'

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
`

const STEPS = [
  { title: 'Connect your AI', subtitle: 'Link Claude or Cursor so MERIDIAN can work for you' },
  { title: 'Connect your wallet', subtitle: 'Only needed when you stake or transfer' },
  { title: "You're ready", subtitle: 'Head home and ask your first question' },
]

export default function StartPage(): ReactElement {
  const [step, setStep] = useState(0)
  const progress = ((step + 1) / STEPS.length) * 100

  return (
    <Box maxWidth={640} mx="auto" px={{ xs: 2, sm: 3 }} py={5}>
      <Typography variant="h3" color="common.white" fontWeight={700} mb={1} sx={{ animation: `${fadeIn} 0.5s ease-out` }}>
        Get set up
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={4}>
        Two minutes. Then just chat.
      </Typography>

      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{ mb: 4, height: 6, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.08)' }}
      />

      <Paper
        sx={{
          p: { xs: 3, sm: 4 },
          borderRadius: 4,
          bgcolor: 'rgba(255,255,255,0.03)',
          border: '1px solid',
          borderColor: 'divider',
          animation: `${fadeIn} 0.5s ease-out 0.1s both`,
        }}
      >
        <Typography variant="overline" color="primary.main" letterSpacing={2}>
          Step {step + 1} of {STEPS.length}
        </Typography>
        <Typography variant="h5" color="common.white" fontWeight={600} mt={0.5} mb={0.5}>
          {STEPS[step].title}
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          {STEPS[step].subtitle}
        </Typography>

        {step === 0 && (
          <>
            <AgentInstaller />
            <Button
              fullWidth
              variant="text"
              sx={{ mt: 2, textTransform: 'none', color: 'text.secondary' }}
              onClick={() => setStep(1)}
            >
              Skip connection for now
            </Button>
          </>
        )}

        {step === 1 && (
          <Stack gap={2}>
            <Typography variant="body1" color="text.secondary">
              Use the wallet button in the top-right corner. MERIDIAN only asks for approval when you
              stake or transfer.
            </Typography>
            <Button
              variant="contained"
              size="large"
              sx={{ borderRadius: 3, py: 1.5, textTransform: 'none', fontSize: 16 }}
              onClick={() => setStep(2)}
            >
              Continue
            </Button>
            <Button
              variant="text"
              sx={{ textTransform: 'none', color: 'text.secondary' }}
              onClick={() => setStep(2)}
            >
              Skip — read-only questions work without a wallet
            </Button>
          </Stack>
        )}

        {step === 2 && (
          <Stack gap={2}>
            <Typography variant="h6" color="success.light">
              ✓ You're all set
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Try: &quot;What's my yield?&quot; or tap a suggestion on the home screen.
            </Typography>
            <Button
              component={Link}
              href="/agent"
              variant="contained"
              size="large"
              sx={{ borderRadius: 3, py: 1.5, textTransform: 'none', fontSize: 16 }}
            >
              Go to Home
            </Button>
          </Stack>
        )}
      </Paper>
    </Box>
  )
}
