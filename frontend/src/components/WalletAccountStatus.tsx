'use client'

import { useCallback, ReactElement } from 'react'
import { Box, Stack, Typography, Button, IconButton, Tooltip } from '@mui/material'
import { useWalletSession } from '@lib/hooks/useWalletSession'
import { useClickReady } from '@lib/hooks/useClickReady'
import { connectCasperWallet, disconnectCasperWallet } from '@lib/wallet/connectCasperWallet'
import { formatMotes, explorerAccountUrl } from '@lib/contracts'
import { PublicKey } from 'casper-js-sdk'
import IconifyIcon from '@/nickelfox/components/base/IconifyIcon'
import { meridianTokens } from '@/design/tokens'
import { panelSurfaceSx } from '@/design/surface'

const shellSx = {
  borderRadius: `${meridianTokens.radius.lg}px`,
  ...panelSurfaceSx({ nested: true }),
}

export default function WalletAccountStatus(): ReactElement {
  const { clickRef } = useClickReady()
  const session = useWalletSession()

  const handleConnect = useCallback(() => {
    void connectCasperWallet(clickRef)
  }, [clickRef])

  const handleDisconnect = useCallback(() => {
    void disconnectCasperWallet(clickRef).then(() => session.refresh())
  }, [clickRef, session])

  if (!session.connected || !session.publicKey) {
    return (
      <Button
        variant="contained"
        color="primary"
        size="small"
        onClick={handleConnect}
        startIcon={<IconifyIcon icon="mdi:wallet-outline" width={16} />}
        sx={{
          borderRadius: `${meridianTokens.radius.md}px`,
          textTransform: 'none',
          fontWeight: 600,
          px: 2,
          boxShadow: '0 2px 12px rgba(153,27,27,0.3)',
        }}
      >
        Connect Wallet
      </Button>
    )
  }

  const accountHash = PublicKey.fromHex(session.publicKey).accountHash().toPrefixedString()

  return (
    <Stack
      direction="row"
      alignItems="center"
      sx={{
        ...shellSx,
        py: 0.5,
        pl: 1.25,
        pr: 0.5,
        gap: 0.5,
      }}
    >
      {session.wrongNetwork ? (
        <Tooltip title="Switch to Casper testnet in your wallet">
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              bgcolor: meridianTokens.color.warning,
              flexShrink: 0,
              ml: 0.5,
            }}
          />
        </Tooltip>
      ) : (
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: `${meridianTokens.radius.sm}px`,
            bgcolor: meridianTokens.color.accentMuted,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <IconifyIcon icon="mdi:wallet-outline" width={16} color={meridianTokens.color.success} />
        </Box>
      )}

      <Stack spacing={0} sx={{ minWidth: 0, px: 0.5 }}>
        <Box
          component="a"
          href={explorerAccountUrl(accountHash)}
          target="_blank"
          rel="noreferrer"
          sx={{
            textDecoration: 'none',
            color: 'common.white',
            fontFamily: meridianTokens.typography.mono.fontFamily,
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: '-0.02em',
            lineHeight: 1.3,
            '&:hover': { color: 'primary.light' },
          }}
        >
          {session.accountLabel}
        </Box>
        {session.balanceMotes ? (
          <Typography
            variant="caption"
            color="text.disabled"
            sx={{
              fontFamily: meridianTokens.typography.mono.fontFamily,
              fontSize: 11,
              lineHeight: 1.3,
              display: { xs: 'none', sm: 'block' },
            }}
          >
            {formatMotes(session.balanceMotes)} CSPR
          </Typography>
        ) : null}
      </Stack>

      <Box
        sx={{
          width: '1px',
          alignSelf: 'stretch',
          my: 0.75,
          bgcolor: meridianTokens.surface.panelBorder,
          display: { xs: 'none', sm: 'block' },
        }}
      />

      <Tooltip title="Disconnect wallet">
        <IconButton
          size="small"
          onClick={handleDisconnect}
          sx={{
            color: 'text.secondary',
            borderRadius: `${meridianTokens.radius.sm}px`,
            '&:hover': { color: 'error.light', bgcolor: 'rgba(239,68,68,0.08)' },
          }}
        >
          <IconifyIcon icon="mdi:logout" width={18} />
        </IconButton>
      </Tooltip>
    </Stack>
  )
}
