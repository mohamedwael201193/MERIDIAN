'use client'

import type { ICSPRClickSDK, SignResult } from '@make-software/csprclick-core-types'
import {
  getDirectWalletPublicKey,
  signMessageWithDirectWallet,
  signWithDirectWallet,
} from './casperWalletDirect'
import { preferDirectCasperWallet } from './walletMode'

export interface WalletSigner {
  getActivePublicKey(): Promise<string | undefined>
  sign(transactionJSON: string | object, signingPublicKey: string): Promise<SignResult | undefined>
  signMessage(message: string, signingPublicKey: string): Promise<SignResult | undefined>
}

export function resolveWalletSigner(
  clickRef: ICSPRClickSDK | null | undefined,
): WalletSigner | null {
  if (preferDirectCasperWallet()) {
    return {
      getActivePublicKey() {
        return Promise.resolve(getDirectWalletPublicKey() ?? undefined)
      },
      sign: signWithDirectWallet,
      signMessage: signMessageWithDirectWallet,
    }
  }

  if (!clickRef) return null

  return {
    async getActivePublicKey() {
      return (
        (await clickRef.getActivePublicKey()) ?? clickRef.currentAccount?.public_key ?? undefined
      )
    },
    sign: (transactionJSON, signingPublicKey) => clickRef.sign(transactionJSON, signingPublicKey),
    signMessage: (message, signingPublicKey) => clickRef.signMessage(message, signingPublicKey),
  }
}
