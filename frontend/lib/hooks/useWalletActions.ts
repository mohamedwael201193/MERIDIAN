'use client';

import { meridianApi } from '@lib/api';
import type { UnsignedTransaction } from '@lib/types';
import { submitSignedTransaction } from '@lib/transactions';
import { buildX402Payment, type PaymentAccept } from '@lib/x402';
import { validatePublicKey } from '@lib/schemas';
import { revalidateMeridianData } from '@lib/hooks/useMeridianData';
import { connectCasperWallet } from '@lib/wallet/connectCasperWallet';
import { useClickReady } from './useClickReady';

export function useWalletActions() {
  const { clickRef } = useClickReady();

  return {
    connect: () => connectCasperWallet(clickRef),
    signIn: () => connectCasperWallet(clickRef),
    signOut: () => clickRef?.signOut?.(),
    async getPublicKey() {
      return clickRef?.currentAccount?.public_key ?? (await clickRef?.getActivePublicKey?.()) ?? null;
    },
    async signAndSubmit(unsigned: UnsignedTransaction) {
      if (!clickRef) throw new Error('Wallet not connected');
      const publicKey = await clickRef.getActivePublicKey();
      if (!publicKey) throw new Error('Wallet not connected');
      validatePublicKey(publicKey);
      const signed = await clickRef.sign(unsigned.transaction as never, publicKey);
      if (!signed?.transaction) throw new Error('Wallet rejected signing');
      const hash = await submitSignedTransaction(signed.transaction);
      await revalidateMeridianData();
      return hash;
    },
    async callWriteTool(tool: string, args: Record<string, unknown>) {
      const publicKey = await clickRef?.getActivePublicKey?.();
      if (!publicKey) throw new Error('Connect wallet first');
      validatePublicKey(publicKey);
      const { result } = await meridianApi.mcpTool(tool, { ...args, callerPublicKey: publicKey });
      return this.signAndSubmit(result as UnsignedTransaction);
    },
    async signX402Payment(accept: PaymentAccept) {
      if (!clickRef) throw new Error('Wallet not connected');
      return buildX402Payment(clickRef, accept);
    },
  };
}
