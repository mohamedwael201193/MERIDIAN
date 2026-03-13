'use client';

import { useCallback } from 'react';
import { Stack, Typography, Chip, Button } from '@mui/material';
import { useWalletSession } from '@lib/hooks/useWalletSession';
import { useClickReady } from '@lib/hooks/useClickReady';
import { formatMotes, explorerAccountUrl } from '@lib/contracts';
import { PublicKey } from 'casper-js-sdk';

/** Dashboard top bar — connected account only (no connect button). */
export default function WalletAccountStatus() {
  const { clickRef } = useClickReady();
  const session = useWalletSession();

  const handleDisconnect = useCallback(() => {
    clickRef?.signOut();
  }, [clickRef]);

  if (!session.connected || !session.publicKey) {
    return null;
  }

  const accountHash = PublicKey.fromHex(session.publicKey).accountHash().toPrefixedString();

  return (
    <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap">
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
        <Typography variant="caption" color="text.secondary">
          {formatMotes(session.balanceMotes)} CSPR
        </Typography>
      ) : null}
      <Button variant="outlined" size="small" onClick={handleDisconnect}>
        Disconnect
      </Button>
    </Stack>
  );
}
