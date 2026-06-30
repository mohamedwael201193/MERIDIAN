import type { ICSPRClickSDK } from '@make-software/csprclick-core-types'
import { WALLET_KEYS } from '@make-software/csprclick-core-types'

export async function connectCasperWallet(
  clickRef: ICSPRClickSDK | null | undefined,
): Promise<void> {
  if (!clickRef) {
    throw new Error('Wallet is still loading — wait a moment and try again')
  }

  if (clickRef.isProviderPresent?.(WALLET_KEYS.CASPER_WALLET)) {
    const account = await clickRef.connect(WALLET_KEYS.CASPER_WALLET)
    if (account?.public_key) return
  }

  // Fallback to the official CSPR.click provider selector.
  clickRef.signIn()
}

export async function disconnectCasperWallet(
  clickRef: ICSPRClickSDK | null | undefined,
): Promise<void> {
  if (!clickRef) return
  await clickRef.disconnect?.(WALLET_KEYS.CASPER_WALLET)
  clickRef.signOut?.()
}
