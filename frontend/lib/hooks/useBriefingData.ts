'use client'

import { useMemo } from 'react'
import { useWalletSession } from '@lib/hooks/useWalletSession'
import {
  useProtocolKpis,
  useHealth,
  useReady,
  useDecisions,
  useHolderCompliance,
} from '@lib/hooks/useMeridianData'
import { accountHashFromPublicKey } from '@lib/wallet/accountHash'
import { formatMotes } from '@lib/contracts'
import type { RuntimePhase } from '@lib/hooks/useAgentRuntime'

export interface BriefingData {
  isLoading: boolean
  portfolioValue: string
  portfolioSubtitle: string
  complianceValue: string
  complianceSubtitle: string
  complianceStatus: 'ok' | 'warn' | 'neutral'
  yieldValue: string
  yieldSubtitle: string
  pendingValue: string
  pendingSubtitle: string
  pendingCount: number
  insight: string
  recommended: string[]
  agentHealthy: boolean
}

function formatApy(bps: number): string {
  return `${(bps / 100).toFixed(2)}% APY`
}

export function useBriefingData(
  unsignedTxPending = false,
  runtimePhase: RuntimePhase = 'idle',
): BriefingData {
  const wallet = useWalletSession()
  const kpis = useProtocolKpis()
  const health = useHealth()
  const ready = useReady()
  const decisions = useDecisions(20)
  const accountHash = wallet.publicKey ? accountHashFromPublicKey(wallet.publicKey) : null
  const compliance = useHolderCompliance(accountHash)

  return useMemo(() => {
    const isLoading = kpis.isLoading || health.isLoading || ready.isLoading
    const primarySymbol = kpis.tokens?.[0]?.symbol ?? 'MRWA'
    const apyBps = kpis.kpis.estimatedApyBps
    const staked = kpis.kpis.totalStaked

    let complianceValue = 'Not checked'
    let complianceSubtitle = 'Connect wallet to verify holder status'
    let complianceStatus: 'ok' | 'warn' | 'neutral' = 'neutral'

    if (wallet.connected && compliance.data) {
      if (compliance.data.compliant) {
        complianceValue = 'Cleared'
        complianceSubtitle = `Status: ${compliance.data.status}`
        complianceStatus = 'ok'
      } else {
        complianceValue = 'Action needed'
        complianceSubtitle = compliance.data.status
        complianceStatus = 'warn'
      }
    } else if (wallet.connected && compliance.isLoading) {
      complianceValue = 'Checking…'
      complianceSubtitle = 'Reading compliance registry'
    }

    const pendingCount =
      (unsignedTxPending || runtimePhase === 'wallet' || runtimePhase === 'waiting' ? 1 : 0) +
      (decisions.data?.filter((d) => d.approved === null).length ?? 0)

    const lastDist = kpis.yieldInfo?.lastDistribution
    const insight = lastDist
      ? `Last distribution in era ${lastDist.era_id}`
      : 'No distributions indexed yet'

    const recommended: string[] = []
    if (apyBps === 0) recommended.push('Check yield')
    if (wallet.connected) recommended.push('Stake 500 CSPR')
    recommended.push('Review portfolio')

    const backendOk = ready.data?.status === 'ok' || health.data?.status === 'ok'
    const mcpOk = backendOk

    return {
      isLoading,
      portfolioValue: primarySymbol,
      portfolioSubtitle: wallet.balanceMotes
        ? `${formatMotes(wallet.balanceMotes)} CSPR available`
        : `${formatMotes(staked)} CSPR staked protocol-wide`,
      complianceValue,
      complianceSubtitle,
      complianceStatus,
      yieldValue: formatApy(apyBps),
      yieldSubtitle: `${formatMotes(staked)} CSPR staked`,
      pendingValue: String(pendingCount),
      pendingSubtitle:
        pendingCount === 1
          ? 'Awaiting your approval'
          : pendingCount > 1
            ? 'Multiple items need attention'
            : 'No actions required',
      pendingCount,
      insight,
      recommended: recommended.slice(0, 3),
      agentHealthy: backendOk && mcpOk,
    }
  }, [kpis, health, ready, wallet, compliance, decisions, unsignedTxPending, runtimePhase])
}
