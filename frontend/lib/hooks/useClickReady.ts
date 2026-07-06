'use client'

import { useEffect, useState } from 'react'
import { useClickRef } from '@make-software/csprclick-ui'
import type { ICSPRClickSDK } from '@make-software/csprclick-core-types'
import { isDirectCasperWalletPresent } from '@lib/wallet/casperWalletDirect'
import { preferDirectCasperWallet } from '@lib/wallet/walletMode'

function isClickReady(clickRef: ICSPRClickSDK | null | undefined): clickRef is ICSPRClickSDK {
  return Boolean(
    clickRef && typeof clickRef.signIn === 'function' && typeof clickRef.connect === 'function',
  )
}

function getBrowserClickRef(clickRef: ICSPRClickSDK | null | undefined): ICSPRClickSDK | null {
  if (isClickReady(clickRef)) {
    return clickRef
  }

  if (typeof window !== 'undefined' && isClickReady(window.csprclick)) {
    return window.csprclick
  }

  return null
}

/** Wait until CSPR.click finishes loading (ClickUI + iframe init). */
export function useClickReady(): { clickRef: ICSPRClickSDK | null; ready: boolean } {
  const clickRef = useClickRef()
  const [sdk, setSdk] = useState<ICSPRClickSDK | null>(() => getBrowserClickRef(clickRef))
  const [timedOut, setTimedOut] = useState(false)

  useEffect(() => {
    const current = getBrowserClickRef(clickRef)
    if (current) {
      setSdk(current)
      return
    }

    setSdk(null)
    const timer = window.setInterval(() => {
      const next = getBrowserClickRef(clickRef)
      if (next) {
        setSdk(next)
        window.clearInterval(timer)
      }
    }, 150)

    const timeout = window.setTimeout(() => {
      setTimedOut(true)
    }, 4_000)

    return () => {
      window.clearInterval(timer)
      window.clearTimeout(timeout)
    }
  }, [clickRef])

  const directReady = preferDirectCasperWallet() && isDirectCasperWalletPresent()

  return {
    clickRef: sdk,
    ready: Boolean(sdk) || directReady || timedOut,
  }
}
