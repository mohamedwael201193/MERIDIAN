import { KeyAlgorithm, PrivateKey, PublicKey } from './index.js'

export function loadPrivateKeyFromPem(
  pem: string,
  preferredAlgorithm?: string,
): InstanceType<typeof PrivateKey> {
  const order =
    preferredAlgorithm === 'ED25519'
      ? [KeyAlgorithm.ED25519, KeyAlgorithm.SECP256K1]
      : [KeyAlgorithm.SECP256K1, KeyAlgorithm.ED25519]
  for (const algorithm of order) {
    try {
      return PrivateKey.fromPem(pem, algorithm)
    } catch {
      /* try next algorithm */
    }
  }
  throw new Error('unable_to_parse_pem')
}

export function verifyPublicKeyMatches(
  privateKey: InstanceType<typeof PrivateKey>,
  expectedHex: string,
): void {
  const actual = privateKey.publicKey.toHex()
  if (actual.toLowerCase() !== expectedHex.trim().toLowerCase()) {
    throw new Error('public_key_mismatch')
  }
}

export function verifyAccountHashMatches(
  privateKey: InstanceType<typeof PrivateKey>,
  expectedAccountHash: string,
): void {
  const actual = privateKey.publicKey.accountHash().toPrefixedString()
  const normalizedExpected = expectedAccountHash.startsWith('account-hash-')
    ? expectedAccountHash
    : `account-hash-${expectedAccountHash}`
  if (actual !== normalizedExpected) {
    throw new Error('account_hash_mismatch')
  }
}

export function signDigest(privateKey: InstanceType<typeof PrivateKey>, digest: Buffer): string {
  return Buffer.from(privateKey.signAndAddAlgorithmBytes(digest)).toString('hex')
}

export function verifyDigestSignature(
  publicKeyHex: string,
  digest: Buffer,
  signatureHex: string,
): boolean {
  const pubKey = PublicKey.fromHex(publicKeyHex)
  return pubKey.verifySignature(digest, Buffer.from(signatureHex, 'hex'))
}
