import { PublicKey } from 'casper-js-sdk'

export function accountHashFromPublicKey(publicKey: string): string {
  const normalized = publicKey.replace(/^0x/i, '')
  return PublicKey.fromHex(normalized).accountHash().toPrefixedString()
}
