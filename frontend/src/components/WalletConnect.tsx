'use client'

import { useCallback } from 'react'
import { Button, Stack, Typography, Alert, Chip } from '@mui/material'
import { useWalletSession } from '@lib/hooks/useWalletSession'
import { useClickReady } from '@lib/hooks/useClickReady'
import { connectCasperWallet, disconnectCasperWallet } from '@lib/wallet/connectCasperWallet'
import { formatMotes, explorerAccountUrl } from '@lib/contracts'
import { PublicKey } from 'casper-js-sdk'

export default function WalletConnect() {
  const { clickRef } = useClickReady()
  const session = useWalletSession()

  const handleConnect = useCallback(() => {
    void connectCasperWallet(clickRef)
  }, [clickRef])

  const handleDisconnect = useCallback(() => {
    void disconnectCasperWallet(clickRef).then(() => session.refresh())
  }, [clickRef, session])

  const accountHash = session.publicKey
    ? PublicKey.fromHex(session.publicKey).accountHash().toPrefixedString()
    : null

  if (!session.connected) {
    return (
      <Button variant="contained" color="primary" size="small" onClick={handleConnect}>
        Connect Wallet
      </Button>
    )
  }

  return (
    <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap">
      {session.wrongNetwork ? (
        <Alert severity="warning" sx={{ py: 0, px: 1 }}>
          Wrong network
        </Alert>
      ) : null}
      <Chip
        size="small"
        label={session.accountLabel}
        component="a"
        href={accountHash ? explorerAccountUrl(accountHash) : undefined}
        target="_blank"
        rel="noreferrer"
        clickable={Boolean(accountHash)}
      />
      {session.balanceMotes ? (
        <Typography variant="caption" color="text.secondary">
          {formatMotes(session.balanceMotes)} CSPR
        </Typography>
      ) : null}
      <Button variant="outlined" size="small" onClick={handleDisconnect}>
        Disconnect
      </Button>
    </Stack>
  )
}
