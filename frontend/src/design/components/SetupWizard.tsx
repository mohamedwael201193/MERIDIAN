'use client'

import { useState, useEffect, ReactElement } from 'react'
import { Box, LinearProgress, Stack, Typography, keyframes } from '@mui/material'
import IconifyIcon from '@/nickelfox/components/base/IconifyIcon'
import GlassCard from '@/design/components/GlassCard'
import PremiumButton from '@/design/components/PremiumButton'
import AgentInstaller from '@/components/AgentInstaller'
import { useWalletSession } from '@lib/hooks/useWalletSession'
import { loadAgentProfile, updateAgentProfile } from '@lib/agent-profile'
import { connectCasperWallet } from '@lib/wallet/connectCasperWallet'
import { useClickReady } from '@lib/hooks/useClickReady'
import { meridianTokens } from '@/design/tokens'
import Link from 'next/link'

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
`

const STEPS = [
  {
    id: 'skill',
    title: 'Install MERIDIAN Skill',
    subtitle: 'Connect your AI assistant to Casper-native tools and policies',
    icon: 'mdi:brain',
  },
  {
    id: 'mcp',
    title: 'Install MCP',
    subtitle: 'Add the Model Context Protocol server for tool execution',
    icon: 'mdi:connection',
  },
  {
    id: 'verify',
    title: 'Verify installation',
    subtitle: 'Confirm MCP health and tool availability',
    icon: 'mdi:shield-check-outline',
  },
  {
    id: 'wallet',
    title: 'Connect wallet',
    subtitle: 'Required only for staking, transfers, and on-chain writes',
    icon: 'mdi:wallet-outline',
  },
  {
    id: 'ready',
    title: 'Everything ready',
    subtitle: 'Your agent operating system is configured',
    icon: 'mdi:check-circle-outline',
  },
] as const

export default function SetupWizard(): ReactElement {
  const [step, setStep] = useState(0)
  const [mcpOk, setMcpOk] = useState<boolean | null>(null)
  const [checking, setChecking] = useState(false)
  const wallet = useWalletSession()
  const { clickRef } = useClickReady()
  const profile = loadAgentProfile()
  const progress = ((step + 1) / STEPS.length) * 100

  const verifyMcp = async () => {
    setChecking(true)
    try {
      const res = await fetch('/api/mcp/health')
      const body = (await res.json()) as { tools?: number }
      setMcpOk(res.ok && (body.tools ?? 0) > 0)
    } catch {
      setMcpOk(false)
    } finally {
      setChecking(false)
    }
  }

  useEffect(() => {
    if (step === 2) void verifyMcp()
  }, [step])

  const current = STEPS[step]

  return (
    <Box maxWidth={720} mx="auto" px={{ xs: 2, sm: 3 }} py={5}>
      <Typography
        variant="h3"
        color="common.white"
        fontWeight={700}
        mb={1}
        sx={{ animation: `${fadeIn} 0.5s ease-out`, letterSpacing: '-0.03em' }}
      >
        Setup
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={4}>
        Configure MERIDIAN in five steps
      </Typography>

      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{ mb: 4, height: 6, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.08)' }}
      />

      <GlassCard padding={4} sx={{ animation: `${fadeIn} 0.5s ease-out 0.1s both` }}>
        <Stack direction="row" gap={2} alignItems="center" mb={3}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: `${meridianTokens.radius.md}px`,
              bgcolor: meridianTokens.color.accentMuted,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconifyIcon icon={current.icon} width={24} color={meridianTokens.color.accent} />
          </Box>
          <Box>
            <Typography sx={{ ...meridianTokens.typography.label, color: 'primary.main' }}>
              Step {step + 1} of {STEPS.length}
            </Typography>
            <Typography variant="h5" color="common.white" fontWeight={600}>
              {current.title}
            </Typography>
          </Box>
        </Stack>

        <Typography variant="body2" color="text.secondary" mb={3}>
          {current.subtitle}
        </Typography>

        {step === 0 && (
          <Stack gap={2}>
            <Typography variant="body2" color="text.secondary">
              Copy the MERIDIAN skill into Claude or Cursor so your assistant understands Casper RWA operations.
            </Typography>
            <PremiumButton onClick={() => { updateAgentProfile({ installedSkills: ['meridian'] }); setStep(1) }} icon="mdi:check">
              Skill installed
            </PremiumButton>
            <PremiumButton variant="text" onClick={() => setStep(1)} sx={{ color: 'text.secondary' }}>
              Skip for now
            </PremiumButton>
          </Stack>
        )}

        {step === 1 && (
          <Stack gap={2}>
            <AgentInstaller />
            <PremiumButton onClick={() => setStep(2)} icon="mdi:arrow-right">
              Continue
            </PremiumButton>
          </Stack>
        )}

        {step === 2 && (
          <Stack gap={2}>
            {checking ? (
              <Typography color="text.secondary">Verifying MCP connection…</Typography>
            ) : mcpOk ? (
              <Stack direction="row" alignItems="center" gap={1}>
                <IconifyIcon icon="mdi:check-circle" color={meridianTokens.color.success} width={20} />
                <Typography color="success.light">MCP verified and tools available</Typography>
              </Stack>
            ) : (
              <Stack gap={1}>
                <Typography color="warning.light">Could not verify MCP. Check your connection and retry.</Typography>
                <PremiumButton onClick={() => void verifyMcp()} loading={checking}>
                  Retry verification
                </PremiumButton>
              </Stack>
            )}
            <PremiumButton onClick={() => setStep(3)} disabled={!mcpOk && !checking} icon="mdi:arrow-right">
              Continue
            </PremiumButton>
          </Stack>
        )}

        {step === 3 && (
          <Stack gap={2}>
            {wallet.connected ? (
              <Stack direction="row" alignItems="center" gap={1}>
                <IconifyIcon icon="mdi:check-circle" color={meridianTokens.color.success} width={20} />
                <Typography color="success.light">Wallet connected · {wallet.accountLabel}</Typography>
              </Stack>
            ) : (
              <>
                <Typography variant="body2" color="text.secondary">
                  Connect Casper Wallet to enable staking and transfers. Read-only queries work without a wallet.
                </Typography>
                <PremiumButton onClick={() => void connectCasperWallet(clickRef)} icon="mdi:wallet-outline">
                  Connect wallet
                </PremiumButton>
              </>
            )}
            <PremiumButton onClick={() => setStep(4)} icon="mdi:arrow-right">
              {wallet.connected ? 'Continue' : 'Skip wallet'}
            </PremiumButton>
          </Stack>
        )}

        {step === 4 && (
          <Stack gap={2}>
            <Stack direction="row" alignItems="center" gap={1}>
              <IconifyIcon icon="mdi:check-circle" color={meridianTokens.color.success} width={24} />
              <Typography variant="h6" color="success.light">
                Setup complete
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary">
              {profile.installedSkills.includes('meridian')
                ? 'Skill and MCP configured. Open the briefing to assign your first task.'
                : 'You can finish skill installation anytime from Setup.'}
            </Typography>
            <PremiumButton component={Link} href="/agent" icon="mdi:view-dashboard-outline">
              Open briefing
            </PremiumButton>
          </Stack>
        )}
      </GlassCard>
    </Box>
  )
}
