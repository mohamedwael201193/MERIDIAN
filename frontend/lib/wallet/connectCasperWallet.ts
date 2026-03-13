import type { ICSPRClickSDK } from '@make-software/csprclick-core-types';

export function connectCasperWallet(clickRef: ICSPRClickSDK | null | undefined): void {
  if (!clickRef) {
    throw new Error('Wallet is still loading — wait a moment and try again');
  }

  // CSPR.click docs: custom Connect buttons should call signIn() and update UI
  // from csprclick:signed_in / csprclick:switched_account events.
  clickRef.signIn();
}
