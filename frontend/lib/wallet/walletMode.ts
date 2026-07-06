'use client'

/** True when a production CSPR.click app id is configured (not localhost-only template). */
export function hasProductionCsprClickAppId(): boolean {
  const appId = process.env.NEXT_PUBLIC_CSPRCLICK_APP_ID?.trim()
  return Boolean(appId && appId !== 'csprclick-template')
}

function isLocalhost(): boolean {
  if (typeof window === 'undefined') return false
  const host = window.location.hostname
  return host === 'localhost' || host === '127.0.0.1'
}

/** Use Casper Wallet extension directly when CSPR.click is not registered for this host. */
export function preferDirectCasperWallet(): boolean {
  if (typeof window === 'undefined') return false
  if (isLocalhost()) return false
  return !hasProductionCsprClickAppId()
}
