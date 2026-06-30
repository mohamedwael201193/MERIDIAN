'use client'

import { useCallback } from 'react'
import { Stack, Typography, Chip, Button, Alert } from '@mui/material'
import { useWalletSession } from '@lib/hooks/useWalletSession'
import { useClickReady } from '@lib/hooks/useClickReady'
import { connectCasperWallet, disconnectCasperWallet } from '@lib/wallet/connectCasperWallet'
import { formatMotes, explorerAccountUrl } from '@lib/contracts'
import { PublicKey } from 'casper-js-sdk'

export default function WalletAccountStatus() {
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
      <Button variant="contained" color="primary" size="small" onClick={handleConnect}>
        Connect Wallet
      </Button>
    )
  }

  const accountHash = PublicKey.fromHex(session.publicKey).accountHash().toPrefixedString()

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
        href={explorerAccountUrl(accountHash)}
        target="_blank"
        rel="noreferrer"
        clickable
      />
      {session.balanceMotes ? (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: { xs: 'none', sm: 'block' } }}
        >
          {formatMotes(session.balanceMotes)} CSPR
        </Typography>
      ) : null}
      <Button variant="outlined" size="small" onClick={handleDisconnect}>
        Disconnect
      </Button>
    </Stack>
  )
}
