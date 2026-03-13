export const MERIDIAN_NETWORK =
  process.env.NEXT_PUBLIC_CASPER_NETWORK ?? 'casper-test';

export const MERIDIAN_TOKEN_PACKAGE =
  process.env.NEXT_PUBLIC_MERIDIAN_CONTRACT_PACKAGE_HASH ??
  'contract-package-9bcac97d0e6723049fc130daa22f69e88a5d077a1df6b4e38536f0703bcaa2ca';

export const CONTRACT_PACKAGES = {
  ComplianceRegistry:
    'contract-package-e6ed2d2eb8a1ffc7aa55a4158643a3682493d6f15f1e7123113a9c8534ee84f8',
  MeridianToken: MERIDIAN_TOKEN_PACKAGE,
  StakingVault:
    'contract-package-3062ba32a4ef4d3fd0fc5c9d0895980b7bbbcc5f407590d1b14c60ca631300c7',
  YieldDistributor:
    'contract-package-378bf2fddb1e574f39014bff6280f101c264da6fc4c629ad4e8c0d8ce55a6c34',
  MeridianAudit:
    'contract-package-1d8bc0bbbb6dda232afcff2afa257e7572d1ac33c518b1852b9a34c707493d84',
} as const;

export const EXPLORER_BASE = 'https://testnet.cspr.live';

export function explorerAccountUrl(accountHash: string): string {
  const hash = accountHash.startsWith('account-hash-')
    ? accountHash
    : `account-hash-${accountHash}`;
  return `${EXPLORER_BASE}/account/${hash}`;
}

export function explorerTxUrl(txHash: string): string {
  return `${EXPLORER_BASE}/deploy/${txHash}`;
}

export function explorerContractUrl(packageHash: string): string {
  return `${EXPLORER_BASE}/contract/${packageHash.replace('contract-package-', 'hash-')}`;
}

export function formatMotes(motes: string | number): string {
  const value = typeof motes === 'string' ? BigInt(motes) : BigInt(motes);
  const whole = value / 1_000_000_000n;
  const frac = value % 1_000_000_000n;
  if (frac === 0n) return whole.toLocaleString();
  return `${whole}.${frac.toString().padStart(9, '0').replace(/0+$/, '')}`;
}

export function formatApy(bps: number): string {
  return `${(bps / 100).toFixed(2)}%`;
}

export function truncateHash(value: string, head = 8, tail = 6): string {
  if (value.length <= head + tail + 3) return value;
  return `${value.slice(0, head)}…${value.slice(-tail)}`;
}
