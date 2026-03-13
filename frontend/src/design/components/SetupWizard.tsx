'use client'

import { useState, useEffect, ReactElement } from 'react'
import {
  Box,
  LinearProgress,
  MenuItem,
  Stack,
  TextField,
  Typography,
  keyframes,
} from '@mui/material'
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

type AiClient = 'cursor' | 'claude' | 'vscode' | 'other'

const STEPS = [
  {
    id: 'client',
    title: 'Choose your AI client',
    subtitle: 'Cursor, Claude Desktop, Claude Code, VS Code, or any MCP-compatible agent',
    icon: 'mdi:application-outline',
  },
  {
    id: 'mcp',
    title: 'Install MCP configuration',
    subtitle: 'Copy the connection JSON into your client settings',
    icon: 'mdi:connection',
  },
  {
    id: 'skill',
    title: 'Install MERIDIAN Skill',
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
    id: 'mission',
    title: 'Run your first mission',
    subtitle: 'Execute a read-only yield check to confirm the pipeline works',
    icon: 'mdi:play-circle-outline',
  },
  {
    id: 'done',
    title: 'Setup complete',
    subtitle: 'Your agent operating system is ready',
    icon: 'mdi:check-circle-outline',
  },
] as const

const FIRST_MISSION = 'What is the current MRWA yield APY?'

function StepRail({ step, onSelect }: { step: number; onSelect: (index: number) => void }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: 'repeat(7, minmax(0, 1fr))', md: '1fr' },
        gap: { xs: 0.5, md: 1 },
        mb: { xs: 3, md: 0 },
      }}
    >
      {STEPS.map((s, index) => {
        const done = index < step
        const active = index === step
        return (
          <Box
            key={s.id}
            component="button"
            type="button"
            onClick={() => (index <= step ? onSelect(index) : undefined)}
            disabled={index > step}
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: { xs: 'center', md: 'flex-start' },
              gap: { xs: 0.5, md: 1.5 },
              p: { xs: 0.75, md: 1.5 },
              border: '1px solid',
              borderColor: active
                ? 'rgba(153,27,27,0.55)'
                : done
                  ? 'rgba(34,197,94,0.35)'
                  : 'rgba(255,255,255,0.08)',
              borderRadius: `${meridianTokens.radius.md}px`,
              bgcolor: active
                ? meridianTokens.color.accentMuted
                : done
                  ? 'rgba(34,197,94,0.08)'
                  : 'rgba(255,255,255,0.02)',
              cursor: index <= step ? 'pointer' : 'default',
              opacity: index > step ? 0.45 : 1,
              textAlign: { xs: 'center', md: 'left' },
              transition: 'border-color 0.2s, background-color 0.2s',
              '&:hover': index <= step
                ? { borderColor: active ? 'rgba(153,27,27,0.7)' : 'rgba(255,255,255,0.18)' }
                : undefined,
            }}
          >
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                bgcolor: active
                  ? meridianTokens.color.accent
                  : done
                    ? 'rgba(34,197,94,0.2)'
                    : 'rgba(255,255,255,0.06)',
                color: active || done ? '#fff' : meridianTokens.color.textMuted,
              }}
            >
              {done ? (
                <IconifyIcon icon="mdi:check" width={16} />
              ) : (
                <IconifyIcon icon={s.icon} width={16} />
              )}
            </Box>
            <Box sx={{ display: { xs: 'none', md: 'block' }, minWidth: 0 }}>
              <Typography
                variant="caption"
                color={active ? 'primary.main' : done ? 'success.light' : 'text.disabled'}
                fontWeight={600}
                display="block"
              >
                Step {index + 1}
              </Typography>
              <Typography
                variant="body2"
                color={active ? 'common.white' : 'text.secondary'}
                fontWeight={active ? 600 : 400}
                noWrap
              >
                {s.title}
              </Typography>
            </Box>
          </Box>
        )
      })}
    </Box>
  )
}

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
    if (step === 3) void verifyMcp()
  }, [step])

  const current = STEPS[step]

  return (
    <Box maxWidth={960} mx="auto" px={{ xs: 2, sm: 3 }} py={{ xs: 3, sm: 5 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-end" mb={3} gap={2}>
        <Box>
          <Typography
            sx={{
              ...meridianTokens.typography.label,
              color: 'primary.main',
              mb: 1,
              animation: `${fadeIn} 0.5s ease-out`,
            }}
          >
            Agent setup
          </Typography>
          <Typography
            variant="h3"
            color="common.white"
            fontWeight={700}
            sx={{ animation: `${fadeIn} 0.5s ease-out`, letterSpacing: '-0.03em' }}
          >
            Connect MERIDIAN
          </Typography>
          <Typography variant="body1" color="text.secondary" mt={1}>
            Wire your AI client to live Casper testnet tools in {STEPS.length} steps
          </Typography>
        </Box>
        <Typography
          variant="h4"
          color="text.disabled"
          fontWeight={700}
          sx={{ fontFamily: meridianTokens.typography.fontFamilyMono, display: { xs: 'none', sm: 'block' } }}
        >
          {String(step + 1).padStart(2, '0')}/{STEPS.length}
        </Typography>
      </Stack>

      <Box mb={3}>
        <Stack direction="row" justifyContent="space-between" mb={1}>
          <Typography variant="caption" color="text.secondary">
            {current.title}
          </Typography>
          <Typography variant="caption" color="text.disabled">
            {Math.round(progress)}%
          </Typography>
        </Stack>
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            height: 8,
            borderRadius: 4,
            bgcolor: 'rgba(255,255,255,0.06)',
            '& .MuiLinearProgress-bar': {
              borderRadius: 4,
              background: `linear-gradient(90deg, ${meridianTokens.color.accent}, #dc2626)`,
            },
          }}
        />
      </Box>

      <Box
        display="grid"
        gridTemplateColumns={{ xs: '1fr', md: '220px 1fr' }}
        gap={meridianTokens.spacing.panelGap}
        alignItems="start"
      >
        <Box sx={{ display: { xs: 'block', md: 'block' } }}>
          <StepRail step={step} onSelect={setStep} />
        </Box>

        <GlassCard
          padding={4}
          sx={{
            animation: `${fadeIn} 0.5s ease-out 0.1s both`,
            p: { xs: 3, sm: 4 },
          }}
        >
          <Stack direction="row" gap={2.5} alignItems="flex-start" mb={3}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: `${meridianTokens.radius.lg}px`,
                bgcolor: meridianTokens.color.accentMuted,
                border: '1px solid rgba(153,27,27,0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <IconifyIcon icon={current.icon} width={28} color={meridianTokens.color.accent} />
            </Box>
            <Box flex={1}>
              <Typography sx={{ ...meridianTokens.typography.label, color: 'primary.main', mb: 0.5 }}>
                Step {step + 1} of {STEPS.length}
              </Typography>
              <Typography variant="h5" color="common.white" fontWeight={700} letterSpacing="-0.02em">
                {current.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" mt={0.75}>
                {current.subtitle}
              </Typography>
            </Box>
          </Stack>

          <Box
            sx={{
              borderTop: '1px solid rgba(255,255,255,0.08)',
              pt: 3,
            }}
          >
            {step === 0 && (
              <Stack gap={2.5}>
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
                  <MenuItem value="vscode">VS Code (MCP extension)</MenuItem>
                  <MenuItem value="other">Other MCP client</MenuItem>
                </TextField>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: `${meridianTokens.radius.md}px`,
                    bgcolor: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    MERIDIAN works with any client that supports Model Context Protocol over HTTP.
                  </Typography>
                </Box>
                <PremiumButton fullWidth onClick={() => setStep(1)} icon="mdi:arrow-right">
                  Continue
                </PremiumButton>
              </Stack>
            )}

            {step === 1 && (
              <AgentInstaller
                defaultClient={client === 'vscode' || client === 'other' ? 'cursor' : client}
                onConfirmed={() => setStep(2)}
              />
            )}

            {step === 2 && (
              <Stack gap={2.5}>
                <Box
                  sx={{
                    p: 2.5,
                    borderRadius: `${meridianTokens.radius.md}px`,
                    bgcolor: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Install the MERIDIAN skill so your {client} assistant understands yield,
                    compliance, and wallet approval flows.
                  </Typography>
                </Box>
                <PremiumButton
                  fullWidth
                  onClick={() => window.open('/meridian-skill.md', '_blank')}
                  variant="outlined"
                  icon="mdi:open-in-new"
                >
                  Open skill file
                </PremiumButton>
                <PremiumButton
                  fullWidth
                  onClick={() => {
                    updateAgentProfile({ installedSkills: ['meridian'] })
                    setStep(3)
                  }}
                  icon="mdi:check"
                >
                  Skill installed — continue
                </PremiumButton>
              </Stack>
            )}

            {step === 3 && (
              <Stack gap={2.5}>
                <Box
                  sx={{
                    p: 2.5,
                    borderRadius: `${meridianTokens.radius.md}px`,
                    border: '1px solid',
                    borderColor: mcpOk ? 'rgba(34,197,94,0.35)' : 'rgba(255,255,255,0.08)',
                    bgcolor: mcpOk ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.03)',
                  }}
                >
                  {checking ? (
                    <Stack direction="row" alignItems="center" gap={1.5}>
                      <IconifyIcon icon="mdi:loading" width={20} />
                      <Typography color="text.secondary">Verifying MCP connection…</Typography>
                    </Stack>
                  ) : mcpOk ? (
                    <Stack direction="row" alignItems="center" gap={1.5}>
                      <IconifyIcon icon="mdi:check-circle" color={meridianTokens.color.success} width={22} />
                      <Typography color="success.light" fontWeight={600}>
                        MCP verified — tools available
                      </Typography>
                    </Stack>
                  ) : (
                    <Stack gap={1.5}>
                      <Typography color="warning.light">
                        Could not verify MCP. Check your connection and retry.
                      </Typography>
                      <PremiumButton onClick={() => void verifyMcp()} loading={checking}>
                        Retry verification
                      </PremiumButton>
                    </Stack>
                  )}
                </Box>
                <PremiumButton
                  fullWidth
                  onClick={() => setStep(4)}
                  disabled={!mcpOk && !checking}
                  icon="mdi:arrow-right"
                >
                  Continue
                </PremiumButton>
              </Stack>
            )}

            {step === 4 && (
              <Stack gap={2.5}>
                {wallet.connected ? (
                  <Box
                    sx={{
                      p: 2.5,
                      borderRadius: `${meridianTokens.radius.md}px`,
                      border: '1px solid rgba(34,197,94,0.35)',
                      bgcolor: 'rgba(34,197,94,0.08)',
                    }}
                  >
                    <Stack direction="row" alignItems="center" gap={1.5}>
                      <IconifyIcon icon="mdi:check-circle" color={meridianTokens.color.success} width={22} />
                      <Typography color="success.light" fontWeight={600}>
                        Wallet connected · {wallet.accountLabel}
                      </Typography>
                    </Stack>
                  </Box>
                ) : (
                  <>
                    <Typography variant="body2" color="text.secondary">
                      Connect Casper Wallet for staking and transfers. Read-only missions work without
                      a wallet.
                    </Typography>
                    <PremiumButton
                      fullWidth
                      onClick={() => void connectCasperWallet(clickRef)}
                      icon="mdi:wallet-outline"
                    >
                      Connect wallet
                    </PremiumButton>
                  </>
                )}
                <PremiumButton fullWidth onClick={() => setStep(5)} icon="mdi:arrow-right">
                  {wallet.connected ? 'Continue' : 'Skip wallet for now'}
                </PremiumButton>
              </Stack>
            )}

            {step === 5 && (
              <Stack gap={2.5}>
                <Typography variant="body2" color="text.secondary">
                  Run a read-only yield check. No wallet signature required.
                </Typography>
                <Box
                  sx={{
                    p: 2.5,
                    borderRadius: `${meridianTokens.radius.md}px`,
                    bgcolor: '#0a0a0e',
                    border: '1px solid rgba(255,255,255,0.1)',
                    fontFamily: meridianTokens.typography.fontFamilyMono,
                  }}
                >
                  <Typography variant="body1" color="common.white">
                    {FIRST_MISSION}
                  </Typography>
                </Box>
                <PremiumButton
                  fullWidth
                  component={Link}
                  href={`/agent?objective=${encodeURIComponent(FIRST_MISSION)}`}
                  icon="mdi:play"
                >
                  Run first mission
                </PremiumButton>
                <PremiumButton
                  fullWidth
                  variant="text"
                  onClick={() => setStep(6)}
                  sx={{ color: 'text.secondary' }}
                >
                  Skip to finish
                </PremiumButton>
              </Stack>
            )}

            {step === 6 && (
              <Stack gap={2.5}>
                <Box
                  sx={{
                    p: 3,
                    borderRadius: `${meridianTokens.radius.lg}px`,
                    border: '1px solid rgba(34,197,94,0.35)',
                    bgcolor: 'rgba(34,197,94,0.08)',
                    textAlign: 'center',
                  }}
                >
                  <Box mb={1}>
                    <IconifyIcon icon="mdi:check-circle" color={meridianTokens.color.success} width={40} />
                  </Box>
                  <Typography variant="h6" color="success.light" fontWeight={700}>
                    Everything ready
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mt={1}>
                    {profile.installedSkills.includes('meridian')
                      ? 'MCP, skill, and briefing are configured. Assign tasks from the command bar anytime.'
                      : 'Finish skill installation from Setup when you are ready.'}
                  </Typography>
                </Box>
                <PremiumButton fullWidth component={Link} href="/agent" icon="mdi:view-dashboard-outline">
                  Open briefing
                </PremiumButton>
              </Stack>
            )}
          </Box>
        </GlassCard>
      </Box>
    </Box>
  )
}
