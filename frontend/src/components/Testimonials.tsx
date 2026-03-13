import SectionShell from './SectionShell';

const evidence = [
  {
    label: 'Contract deployment',
    value: '5 packages',
    detail: 'ComplianceRegistry, MeridianToken, StakingVault, YieldDistributor, and MeridianAudit are live on casper-test.',
  },
  {
    label: 'x402 validation',
    value: '100/100',
    detail: 'Phase 8.5 recorded one hundred successful x402 settlements with transaction hashes.',
  },
  {
    label: 'MCP tools',
    value: '12 tools',
    detail: 'Read tools return live data and write tools return unsigned TransactionV1 payloads for local signing.',
  },
  {
    label: 'Frontend routes',
    value: '9/9',
    detail: 'Landing, dashboard, issue, audit, agents, compliance, staking, MCP, and x402 routes return 200.',
  },
  {
    label: 'Automated checks',
    value: 'Green',
    detail: 'Build, Vitest, Playwright smoke, secret scans, and backend proxy checks pass.',
  },
  {
    label: 'Open blocker',
    value: 'Manual wallet',
    detail: 'Final sign-off requires funded-wallet MCP writes and x402 settlement from the browser.',
  },
];

export default function Testimonials() {
  const marqueeItems = [...evidence, ...evidence];

  return (
    <SectionShell>
      <div className="border-b border-white/10 px-6 py-12 text-center sm:px-10 lg:px-14 lg:py-16">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Verified Integration Signals
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-zinc-500 sm:text-base">
          No fictional testimonials. These cards summarize the current state proven by reports,
          route checks, and live service calls.
        </p>
      </div>

      <div className="overflow-hidden border-b border-white/10 py-8">
        <div className="flex w-max animate-marquee">
          {marqueeItems.map((item, index) => (
            <article
              key={`${item.label}-${index}`}
              className="w-[320px] shrink-0 border-r border-white/10 bg-black p-8 sm:w-[360px]"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-red-400/70">
                {item.label}
              </p>
              <p className="mt-4 text-3xl font-black tracking-tight text-white">{item.value}</p>
              <p className="mt-4 text-sm leading-relaxed text-zinc-400">{item.detail}</p>
              <div className="mt-6 border-t border-white/10 pt-6">
                <p className="text-sm text-zinc-600">MERIDIAN integration evidence</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </SectionShell>
  );
}
