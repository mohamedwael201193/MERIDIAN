'use client'

import useSWR, { mutate } from 'swr'
import { meridianApi } from '@lib/api'
import { MERIDIAN_TOKEN_PACKAGE } from '@lib/contracts'

export function useHealth() {
  return useSWR('health', () => meridianApi.health(), { refreshInterval: 60_000 })
}

export function useReady() {
  return useSWR('ready', () => meridianApi.ready(), { refreshInterval: 60_000 })
}

export function useTokens() {
  return useSWR('tokens', () => meridianApi.tokens().then((r) => r.data), {
    refreshInterval: 30_000,
  })
}

export function useTokenYield(packageHash = MERIDIAN_TOKEN_PACKAGE) {
  return useSWR(
    ['token-yield', packageHash],
    () => meridianApi.tokenYield(packageHash).then((r) => r.data),
    { refreshInterval: 30_000 },
  )
}

export function useYieldHistory(limit = 50) {
  return useSWR(
    ['yield-history', limit],
    () => meridianApi.yieldHistory(limit).then((r) => r.data),
    { refreshInterval: 60_000 },
  )
}

export function useHolders(limit = 100) {
  return useSWR(['holders', limit], () => meridianApi.holders(limit).then((r) => r.data), {
    refreshInterval: 30_000,
  })
}

export function useHolderCompliance(accountHash: string | null) {
  return useSWR(
    accountHash ? ['holder-compliance', accountHash] : null,
    () => meridianApi.holderCompliance(accountHash!).then((r) => r.data),
    { refreshInterval: 30_000 },
  )
}

export function useEvents(limit = 50) {
  return useSWR(['events', limit], () => meridianApi.events(limit).then((r) => r.data), {
    refreshInterval: 30_000,
  })
}

export function useAuditSummaries(limit = 20) {
  return useSWR(
    ['audit-summaries', limit],
    () => meridianApi.auditSummaries(limit).then((r) => r.data),
    { refreshInterval: 60_000 },
  )
}

export function useDecisions(limit = 50) {
  return useSWR(['decisions', limit], () => meridianApi.decisions(limit).then((r) => r.data), {
    refreshInterval: 30_000,
  })
}

export function useProtocolKpis() {
  const tokens = useTokens()
  const yieldInfo = useTokenYield()
  const holders = useHolders(500)
  const health = useHealth()

  const primaryToken = tokens.data?.[0]
  const compliantCount =
    holders.data?.filter((h) => h.status === 'registered' && h.sanctions_cleared).length ?? 0

  return {
    isLoading: tokens.isLoading || yieldInfo.isLoading || holders.isLoading,
    error: tokens.error ?? yieldInfo.error ?? holders.error,
    kpis: {
      totalStaked: primaryToken?.total_staked ?? yieldInfo.data?.totalStaked ?? '0',
      estimatedApyBps: yieldInfo.data?.estimatedApyBps ?? 0,
      compliantHolders: compliantCount,
      activeTokens: tokens.data?.length ?? 0,
      currentEra: yieldInfo.data?.lastDistribution?.era_id ?? health.data?.events_indexed ?? '—',
    },
    tokens: tokens.data,
    yieldInfo: yieldInfo.data,
  }
}

export async function revalidateMeridianData() {
  await mutate(
    (key) =>
      typeof key === 'string' ||
      (Array.isArray(key) &&
        [
          'tokens',
          'token-yield',
          'yield-history',
          'holders',
          'events',
          'audit-summaries',
          'decisions',
          'health',
          'ready',
          'holder-compliance',
        ].includes(String(key[0]))),
  )
}
