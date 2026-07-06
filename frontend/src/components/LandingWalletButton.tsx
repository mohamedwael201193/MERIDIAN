'use client'

import { useCallback, useState } from 'react'
import { useWalletSession } from '@lib/hooks/useWalletSession'
import { useClickReady } from '@lib/hooks/useClickReady'
import { connectCasperWallet, disconnectCasperWallet } from '@lib/wallet/connectCasperWallet'
import { formatMotes, explorerAccountUrl } from '@lib/contracts'
import { PublicKey } from 'casper-js-sdk'

export default function LandingWalletButton() {
  const { clickRef, ready } = useClickReady()
  const session = useWalletSession()
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConnect = useCallback(async () => {
    setError(null)
    setConnecting(true)
    try {
      await connectCasperWallet(clickRef)
      await session.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect wallet')
    } finally {
      setConnecting(false)
    }
  }, [clickRef, session])

  const handleDisconnect = useCallback(async () => {
    await disconnectCasperWallet(clickRef)
    await session.refresh()
  }, [clickRef, session])

  if (session.connected && session.publicKey) {
    const accountHash = PublicKey.fromHex(session.publicKey).accountHash().toPrefixedString()

    return (
      <div className="flex items-center gap-3">
        <a
          href={explorerAccountUrl(accountHash)}
          target="_blank"
          rel="noreferrer"
          className="hidden text-sm text-zinc-300 transition hover:text-white sm:inline"
        >
          {session.accountLabel}
          {session.balanceMotes ? ` · ${formatMotes(session.balanceMotes)} CSPR` : ''}
        </a>
        <button
          type="button"
          onClick={() => void handleDisconnect()}
          className="inline-flex items-center rounded-md border border-white/20 px-4 py-2 text-sm font-medium text-white transition hover:border-red-500/50 hover:bg-red-500/10"
        >
          Disconnect
        </button>
      </div>
    )
  }

  const label = !ready
    ? 'Loading wallet…'
    : connecting
      ? 'Connecting…'
      : 'Connect Wallet'

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={() => void handleConnect()}
        disabled={!ready || connecting}
        className="inline-flex items-center rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-red-900/30 transition hover:bg-red-500 disabled:opacity-70"
      >
        {label}
      </button>
      {error ? (
        <span className="max-w-[220px] text-right text-xs text-red-400">{error}</span>
      ) : null}
    </div>
  )
}
