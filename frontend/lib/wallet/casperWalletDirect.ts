'use client'

import type { SignResult } from '@make-software/csprclick-core-types'

type CasperWalletProvider = {
  requestConnection: () => Promise<boolean>
  disconnectFromSite: () => Promise<boolean>
  requestSwitchAccount: () => Promise<boolean>
  isConnected: () => Promise<boolean>
  getActivePublicKey: () => Promise<string | undefined>
  getVersion: () => Promise<string>
  getActivePublicKeySupports: () => Promise<string[] | string>
  sign: (deployJson: string, signingPublicKeyHex: string) => Promise<SignResult>
  signMessage: (message: string, signingPublicKeyHex: string) => Promise<SignResult>
}

declare global {
  interface Window {
    CasperWalletProvider?: () => CasperWalletProvider
  }
}

const listeners = new Set<() => void>()
let cachedPublicKey: string | null = null

function notify() {
  listeners.forEach((listener) => {
    listener()
  })
}

export function subscribeDirectWallet(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getDirectWalletPublicKey(): string | null {
  return cachedPublicKey
}

export function setDirectWalletPublicKey(publicKey: string | null): void {
  cachedPublicKey = publicKey
  notify()
}

export function isDirectCasperWalletPresent(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return typeof window.CasperWalletProvider === 'function'
  } catch {
    return false
  }
}

export function getCasperWalletProvider(): CasperWalletProvider | null {
  if (!isDirectCasperWalletPresent()) return null
  try {
    return window.CasperWalletProvider?.() ?? null
  } catch {
    return null
  }
}

export async function refreshDirectWalletSession(): Promise<string | null> {
  const provider = getCasperWalletProvider()
  if (!provider) {
    setDirectWalletPublicKey(null)
    return null
  }

  try {
    const connected = await provider.isConnected()
    if (!connected) {
      setDirectWalletPublicKey(null)
      return null
    }
    const publicKey = await provider.getActivePublicKey()
    setDirectWalletPublicKey(publicKey ?? null)
    return publicKey ?? null
  } catch {
    setDirectWalletPublicKey(null)
    return null
  }
}

export async function connectDirectCasperWallet(): Promise<string> {
  const provider = getCasperWalletProvider()
  if (!provider) {
    throw new Error('Install the Casper Wallet browser extension to connect.')
  }

  const connected = await provider.requestConnection()
  if (!connected) {
    throw new Error('Wallet connection was rejected.')
  }

  const publicKey = await provider.getActivePublicKey()
  if (!publicKey) {
    throw new Error('Unlock Casper Wallet, then try again.')
  }

  setDirectWalletPublicKey(publicKey)
  return publicKey
}

export async function disconnectDirectCasperWallet(): Promise<void> {
  const provider = getCasperWalletProvider()
  if (provider) {
    try {
      await provider.disconnectFromSite()
    } catch {
      // Ignore disconnect errors; clear local session regardless.
    }
  }
  setDirectWalletPublicKey(null)
}

export async function signWithDirectWallet(
  transactionJSON: string | object,
  signingPublicKey: string,
): Promise<SignResult> {
  const provider = getCasperWalletProvider()
  if (!provider) {
    throw new Error('Casper Wallet extension is not available.')
  }

  const payload =
    typeof transactionJSON === 'string' ? transactionJSON : JSON.stringify(transactionJSON)
  return provider.sign(payload, signingPublicKey)
}

export async function signMessageWithDirectWallet(
  message: string,
  signingPublicKey: string,
): Promise<SignResult> {
  const provider = getCasperWalletProvider()
  if (!provider) {
    throw new Error('Casper Wallet extension is not available.')
  }

  return provider.signMessage(message, signingPublicKey)
}
