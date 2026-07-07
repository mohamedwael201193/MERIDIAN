'use client'

import { useState, useEffect, ReactElement } from 'react'
import { Box, LinearProgress, MenuItem, Stack, TextField, Typography, keyframes } from '@mui/material'
import IconifyIcon from '@/nickelfox/components/base/IconifyIcon'
import GlassCard from '@/design/components/GlassCard'
import PremiumButton from '@/design/components/PremiumButton'
import AgentInstaller from '@/components/AgentInstaller'
import { useWalletSession } from '@lib/hooks/useWalletSession'
import { loadAgentProfile, updateAgentProfile } from '@lib/agent-profile'
import { connectCasperWallet } from '@lib/wallet/connectCasperWallet'
import { useClickReady } from '@lib/hooks/useClickReady'
import { meridianTokens } from '@/design/tokens'
import { formatMotes, MERIDIAN_NETWORK } from '@lib/contracts'
import Link from 'next/link'

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
`

type AiClient = 'cursor' | 'claude' | 'vscode' | 'other'

const STEPS = [
  {
    id: 'wallet',
    title: 'Connect wallet',
    subtitle: 'Casper Wallet is required for every on-chain write operation',
    icon: 'mdi:wallet-outline',
  },
  {
    id: 'network',
    title: 'Verify network',
    subtitle: 'Confirm the wallet is connected to Casper testnet and balance is visible',
    icon: 'mdi:server-network',
  },
  {
    id: 'mcp',
    title: 'Install Meridian MCP',
    subtitle: 'Copy the connection JSON into your client settings',
    icon: 'mdi:connection',
  },
  {
    id: 'skill',
    title: 'Install Meridian Skill',
    subtitle: 'Give your assistant Casper RWA policies and tool usage guidance',
    icon: 'mdi:brain',
  },
  {
    id: 'verify',
    title: 'Verify MCP connection',
    subtitle: 'Confirm the server is online and tools are available',
    icon: 'mdi:shield-check-outline',
  },
  {
    id: 'wallet',
    title: 'Connect Casper Wallet',
    subtitle: 'Required for staking, transfers, and on-chain writes',
    icon: 'mdi:wallet-outline',
  },
  {
    id: 'first-read',
    title: 'Run first read command',
    subtitle: 'Execute a live yield check from MCP and indexed Casper state',
    icon: 'mdi:play-circle-outline',
  },
  {
    id: 'first-write',
    title: 'Run first on-chain transaction',
    subtitle: 'Build, sign, broadcast, and finalize a real Casper testnet transaction',
    icon: 'mdi:pen',
  },
  {
    id: 'done',
    title: 'Success',
    subtitle: 'Shown only after a finalized on-chain transaction is recorded',
    icon: 'mdi:check-circle-outline',
  },
] as const

const FIRST_MISSION = 'What is the current MRWA yield APY?'
const FIRST_WRITE_MISSION = 'Delegate 500 CSPR to the best validator'

export default function SetupWizard(): ReactElement {
  const [step, setStep] = useState(0)
  const [client, setClient] = useState<AiClient>('cursor')
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
    if (step === 4) void verifyMcp()
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
        Connect MERIDIAN to your AI client in {STEPS.length} steps
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
            {wallet.connected ? (
              <Stack direction="row" alignItems="center" gap={1}>
                <IconifyIcon icon="mdi:check-circle" color={meridianTokens.color.success} width={20} />
                <Typography color="success.light">Wallet connected: {wallet.accountLabel}</Typography>
              </Stack>
            ) : (
              <PremiumButton onClick={() => void connectCasperWallet(clickRef)} icon="mdi:wallet-outline">
                Connect wallet
              </PremiumButton>
            )}
            <PremiumButton onClick={() => setStep(1)} disabled={!wallet.connected} icon="mdi:arrow-right">
              Verify network
            </PremiumButton>
          </Stack>
        )}

        {step === 1 && (
          <Stack gap={2}>
            <Typography variant="body2" color="text.secondary">
              Expected network: {MERIDIAN_NETWORK}
            </Typography>
            <Typography variant="body2" color={wallet.wrongNetwork ? 'warning.light' : 'success.light'}>
              {wallet.wrongNetwork ? 'Wallet is on the wrong network' : 'Wallet network verified'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Balance:{' '}
              {wallet.balanceMotes ? `${formatMotes(wallet.balanceMotes)} CSPR` : 'Reading from Casper RPC'}
            </Typography>
            <PremiumButton
              onClick={() => setStep(2)}
              disabled={!wallet.connected || wallet.wrongNetwork}
              icon="mdi:arrow-right"
            >
              Install MCP
            </PremiumButton>
          </Stack>
        )}

        {step === 2 && (
          <Stack gap={2}>
            <TextField
              select
              label="AI client"
              value={client}
              onChange={(e) => setClient(e.target.value as AiClient)}
              fullWidth
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
            >
              <MenuItem value="cursor">Cursor</MenuItem>
              <MenuItem value="claude">Claude Desktop</MenuItem>
              <MenuItem value="vscode">VS Code MCP extension</MenuItem>
              <MenuItem value="other">Other MCP client</MenuItem>
            </TextField>
            <AgentInstaller defaultClient={client === 'vscode' || client === 'other' ? 'cursor' : client} />
            <PremiumButton onClick={() => setStep(3)} icon="mdi:arrow-right">
              MCP installed
            </PremiumButton>
          </Stack>
        )}

        {step === 3 && (
          <Stack gap={2}>
            <Typography variant="body2" color="text.secondary">
              Install the Meridian skill so your {client} assistant understands yield, compliance,
              and wallet approval flows.
            </Typography>
            <PremiumButton
              onClick={() => window.open('/meridian-skill.md', '_blank')}
              variant="outlined"
              icon="mdi:open-in-new"
            >
              Open skill file
            </PremiumButton>
            <PremiumButton
              onClick={() => {
                updateAgentProfile({ installedSkills: ['meridian'] })
                setStep(4)
              }}
              icon="mdi:check"
            >
              Skill installed
            </PremiumButton>
          </Stack>
        )}

        {step === 4 && (
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
            <PremiumButton onClick={() => setStep(5)} disabled={!mcpOk && !checking} icon="mdi:arrow-right">
              Continue
            </PremiumButton>
          </Stack>
        )}

        {step === 5 && (
          <Stack gap={2}>
            <Typography variant="body2" color="text.secondary">
              Run a read-only yield check. No wallet signature required.
            </Typography>
            <Typography variant="body1" color="common.white" sx={{ fontFamily: 'var(--font-geist-mono, monospace)' }}>
              {FIRST_MISSION}
            </Typography>
            <PremiumButton
              component={Link}
              href={`/agent?objective=${encodeURIComponent(FIRST_MISSION)}`}
              icon="mdi:play"
            >
              Run first read
            </PremiumButton>
            <PremiumButton variant="text" onClick={() => setStep(6)} sx={{ color: 'text.secondary' }}>
              Continue to first transaction
            </PremiumButton>
          </Stack>
        )}

        {step === 6 && (
          <Stack gap={2}>
            <Typography variant="body2" color="text.secondary">
              This builds an unsigned native Casper delegation. Success is recorded only after wallet
              signature, RPC broadcast, finality, and backend refresh.
            </Typography>
            <Typography variant="body1" color="common.white" sx={{ fontFamily: 'var(--font-geist-mono, monospace)' }}>
              {FIRST_WRITE_MISSION}
            </Typography>
            <PremiumButton
              component={Link}
              href={`/agent?objective=${encodeURIComponent(FIRST_WRITE_MISSION)}`}
              icon="mdi:pen"
            >
              Run first transaction
            </PremiumButton>
            <PremiumButton variant="text" onClick={() => setStep(7)} sx={{ color: 'text.secondary' }}>
              Check setup success
            </PremiumButton>
          </Stack>
        )}

        {step === 7 && (
          <Stack gap={2}>
            {profile.missionsCompleted > 0 ? (
              <>
                <Stack direction="row" alignItems="center" gap={1}>
                  <IconifyIcon icon="mdi:check-circle" color={meridianTokens.color.success} width={24} />
                  <Typography variant="h6" color="success.light">
                    On-chain setup verified
                  </Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  Wallet, MCP, skill, read command, and finalized transaction are recorded.
                </Typography>
              </>
            ) : (
              <>
                <Typography variant="h6" color="warning.light">
                  Finalized transaction not recorded yet
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Run the first transaction and return after finality. MERIDIAN will not mark setup
                  successful without that evidence.
                </Typography>
              </>
            )}
            <PremiumButton component={Link} href="/agent" icon="mdi:view-dashboard-outline">
              Open briefing
            </PremiumButton>
          </Stack>
        )}
      </GlassCard>
    </Box>
  )
}
