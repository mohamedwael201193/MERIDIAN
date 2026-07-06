'use client'

import { useCallback, useEffect, useState } from 'react'
import type { AccountType } from '@make-software/csprclick-core-types'
import { MERIDIAN_NETWORK, truncateHash } from '@lib/contracts'
import {
  getDirectWalletPublicKey,
  refreshDirectWalletSession,
  subscribeDirectWallet,
} from '@lib/wallet/casperWalletDirect'
import { preferDirectCasperWallet } from '@lib/wallet/walletMode'
import { useClickReady } from './useClickReady'

export interface WalletSession {
  connected: boolean
  publicKey: string | null
  accountLabel: string | null
  balanceMotes: string | null
  wrongNetwork: boolean
  refresh: () => Promise<void>
}

type AccountChangedEvent = {
  account?: AccountType
}

export function useWalletSession(): WalletSession {
  const { clickRef } = useClickReady()
  const [account, setAccount] = useState<AccountType | null>(null)
  const [directPublicKey, setDirectPublicKey] = useState<string | null>(() =>
    preferDirectCasperWallet() ? getDirectWalletPublicKey() : null,
  )

  const refresh = useCallback(async () => {
    if (preferDirectCasperWallet()) {
      const publicKey = await refreshDirectWalletSession()
      setDirectPublicKey(publicKey)
      return
    }

    if (!clickRef) {
      setAccount(null)
      return
    }
    if (clickRef.currentAccount?.public_key) {
      setAccount(clickRef.currentAccount)
      return
    }
    try {
      const active = await clickRef.getActiveAccountAsync({ withBalance: true })
      setAccount(active ?? null)
    } catch {
      setAccount(null)
    }
  }, [clickRef])

  useEffect(() => {
    void refresh()
    const timer = setInterval(() => {
      void refresh()
    }, 30_000)
    return () => {
      clearInterval(timer)
    }
  }, [refresh])

  useEffect(() => {
    if (!preferDirectCasperWallet()) return
    return subscribeDirectWallet(() => {
      setDirectPublicKey(getDirectWalletPublicKey())
    })
  }, [])

  useEffect(() => {
    if (preferDirectCasperWallet() || !clickRef) return
    const onAccount = (event?: AccountChangedEvent) => {
      if (event?.account?.public_key) {
        setAccount(event.account)
        return
      }
      void refresh()
    }
    const onDisconnected = () => {
      setAccount(null)
    }

    clickRef.on('csprclick:signed_in', onAccount)
    clickRef.on('csprclick:switched_account', onAccount)
    clickRef.on('csprclick:unsolicited_account_change', onAccount)
    clickRef.on('csprclick:signed_out', onDisconnected)
    clickRef.on('csprclick:disconnected', onDisconnected)

    return () => {
      clickRef.off('csprclick:signed_in', onAccount)
      clickRef.off('csprclick:switched_account', onAccount)
      clickRef.off('csprclick:unsolicited_account_change', onAccount)
      clickRef.off('csprclick:signed_out', onDisconnected)
      clickRef.off('csprclick:disconnected', onDisconnected)
    }
  }, [clickRef, refresh])

  const publicKey = preferDirectCasperWallet() ? directPublicKey : (account?.public_key ?? null)
  const wrongNetwork = preferDirectCasperWallet()
    ? false
    : Boolean(clickRef?.chainName && clickRef.chainName !== MERIDIAN_NETWORK)

  return {
    connected: Boolean(publicKey),
    publicKey,
    accountLabel: publicKey ? truncateHash(publicKey, 10, 8) : null,
    balanceMotes: account?.liquid_balance ?? account?.balance ?? null,
    wrongNetwork,
    refresh,
  }
}
