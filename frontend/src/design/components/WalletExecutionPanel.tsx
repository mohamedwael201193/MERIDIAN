'use client'

import { ReactElement, useCallback, useMemo } from 'react'
import { Alert, Box, Button, Chip, Link, Stack, Typography } from '@mui/material'
import GlassCard from '@/design/components/GlassCard'
import IconifyIcon from '@/nickelfox/components/base/IconifyIcon'
import { meridianTokens } from '@/design/tokens'
import { useWalletSession } from '@lib/hooks/useWalletSession'
import { useClickReady } from '@lib/hooks/useClickReady'
import { connectCasperWallet, disconnectCasperWallet } from '@lib/wallet/connectCasperWallet'
import { accountHashFromPublicKey } from '@lib/wallet/accountHash'
import { explorerAccountUrl, explorerTxUrl, formatMotes, MERIDIAN_NETWORK } from '@lib/contracts'
import type { RuntimePhase } from '@lib/hooks/useAgentRuntime'

interface WalletExecutionPanelProps {
  phase: RuntimePhase
  unsignedTxPending: boolean
  txHash: string | null
}

function phaseLabel(phase: RuntimePhase, unsignedTxPending: boolean, txHash: string | null): string {
  if (phase === 'wallet' || unsignedTxPending) return 'Signature required'
  if (phase === 'waiting') return 'Waiting for wallet approval'
  if (phase === 'broadcast' && txHash) return 'Submitted to Casper RPC'
  if (phase === 'finalized' || phase === 'complete') return 'Finalized on Casper testnet'
  if (phase === 'error') return 'Action failed'
  return 'No wallet action pending'
}

export default function WalletExecutionPanel({
  phase,
  unsignedTxPending,
  txHash,
}: WalletExecutionPanelProps): ReactElement {
  const wallet = useWalletSession()
  const { clickRef } = useClickReady()

  const accountHash = useMemo(() => {
    if (!wallet.publicKey) return null
    try {
      return accountHashFromPublicKey(wallet.publicKey)
    } catch {
      return null
    }
  }, [wallet.publicKey])

  const connect = useCallback(async () => {
    await connectCasperWallet(clickRef)
    await wallet.refresh()
  }, [clickRef, wallet])

  const disconnect = useCallback(async () => {
    await disconnectCasperWallet(clickRef)
    await wallet.refresh()
  }, [clickRef, wallet])

  const status = phaseLabel(phase, unsignedTxPending, txHash)
  const requiresAttention = wallet.wrongNetwork || phase === 'wallet' || phase === 'waiting'

  return (
    <GlassCard padding={2.25} sx={{ mb: 3 }}>
      <Stack direction={{ xs: 'column', lg: 'row' }} gap={2} alignItems={{ lg: 'center' }}>
        <Box flex={1}>
          <Stack direction="row" gap={1.25} alignItems="center" mb={1}>
            <IconifyIcon
              icon="mdi:wallet-outline"
              width={18}
              color={wallet.connected ? meridianTokens.color.success : meridianTokens.color.textMuted}
            />
            <Typography sx={{ ...meridianTokens.typography.title, color: 'common.white' }}>
              Wallet execution
            </Typography>
            <Chip
              size="small"
              color={wallet.connected ? (wallet.wrongNetwork ? 'warning' : 'success') : 'default'}
              label={wallet.connected ? 'Connected' : 'Not connected'}
            />
          </Stack>

          <Stack direction="row" gap={1} flexWrap="wrap">
            <Chip size="small" variant="outlined" label={`Network ${MERIDIAN_NETWORK}`} />
            <Chip
              size="small"
              variant="outlined"
              label={
                wallet.balanceMotes
                  ? `${formatMotes(wallet.balanceMotes)} CSPR`
                  : 'Balance unavailable from provider'
              }
            />
            <Chip
              size="small"
              variant="outlined"
              label={wallet.connected && !wallet.wrongNetwork ? 'Permission active' : 'Permission required'}
            />
            <Chip size="small" color={requiresAttention ? 'warning' : 'default'} label={status} />
          </Stack>

          {wallet.publicKey ? (
            <Typography variant="caption" color="text.secondary" display="block" mt={1}>
              Public key: {wallet.accountLabel}
            </Typography>
          ) : null}
        </Box>

        <Stack direction="row" gap={1} flexWrap="wrap" justifyContent={{ xs: 'flex-start', lg: 'flex-end' }}>
          {accountHash ? (
            <Button
              component={Link}
              href={explorerAccountUrl(accountHash)}
              target="_blank"
              variant="outlined"
              size="small"
            >
              Account explorer
            </Button>
          ) : null}
          {txHash ? (
            <Button component={Link} href={explorerTxUrl(txHash)} target="_blank" variant="outlined" size="small">
              Transaction explorer
            </Button>
          ) : null}
          {wallet.connected ? (
            <Button variant="outlined" color="error" size="small" onClick={() => void disconnect()}>
              Disconnect
            </Button>
          ) : (
            <Button variant="contained" color="error" size="small" onClick={() => void connect()}>
              Connect wallet
            </Button>
          )}
        </Stack>
      </Stack>

      {wallet.wrongNetwork ? (
        <Alert severity="warning" sx={{ mt: 2 }}>
          Switch Casper Wallet to {MERIDIAN_NETWORK}. MERIDIAN will not build write actions on the
          wrong network.
        </Alert>
      ) : null}
    </GlassCard>
  )
}
