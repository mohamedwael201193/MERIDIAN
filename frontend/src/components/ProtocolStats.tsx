'use client';

import { formatApy, formatMotes } from '@lib/contracts';
import { useProtocolKpis, useEvents } from '@lib/hooks/useMeridianData';

export default function ProtocolStats() {
  const { kpis, isLoading, error } = useProtocolKpis();
  const events = useEvents(10);

  if (error) {
    return (
      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Status" value="Backend unavailable" />
      </div>
    );
  }

  return (
    <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Total staked"
        value={isLoading ? '…' : `${formatMotes(kpis.totalStaked)} CSPR`}
      />
      <StatCard
        label="Estimated APY"
        value={isLoading ? '…' : formatApy(kpis.estimatedApyBps)}
      />
      <StatCard
        label="Compliant holders"
        value={isLoading ? '…' : String(kpis.compliantHolders)}
      />
      <StatCard
        label="Indexed events"
        value={isLoading ? '…' : String(events.data?.length ?? kpis.currentEra)}
      />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.025] px-4 py-3 text-left backdrop-blur-sm">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="mt-1.5 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}
