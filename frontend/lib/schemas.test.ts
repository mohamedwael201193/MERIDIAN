import { describe, expect, it } from 'vitest';
import { validatePublicKey, validateAccountHash, publicKeySchema } from './schemas';

describe('schemas', () => {
  it('accepts valid SECP256K1 public key', () => {
    const key = '0203d64d1b7f66f18c0abe9836df604c187797ddb962b9fc3396201c245f9de335a6';
    expect(publicKeySchema.parse(key)).toBe(key);
  });

  it('rejects invalid public key', () => {
    expect(() => validatePublicKey('invalid')).toThrow();
  });

  it('normalizes account hash', () => {
    const hash = 'a'.repeat(64);
    expect(validateAccountHash(hash)).toBe(`account-hash-${hash}`);
  });
});
