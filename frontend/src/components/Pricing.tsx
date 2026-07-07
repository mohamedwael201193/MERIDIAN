import SectionShell from './SectionShell'

const phases = [
  {
    name: 'Live Testnet Stack',
    status: 'Operational',
    description:
      'Unified dashboard UI, live Render services, and Casper testnet contracts wired end-to-end.',
    features: [
      '5 deployed contract packages',
      'Briefing, agents, MCP, templates, marketplace',
      '13 MCP tools (6 read · 7 write)',
      'x402 unpaid 402 flow verified',
    ],
    cta: 'Open Briefing',
    href: '/agent',
    highlighted: false,
  },
  {
    name: 'MCP & Wallet Flow',
    status: 'Ready',
    description:
      'MCP Tool Explorer with search, grouped read/write tools, and transaction review for writes.',
    features: [
      'Searchable tool sidebar',
      'Instant read tool invocation',
      'Unsigned TransactionV1 for writes',
      'CSPR.click wallet signing path',
    ],
    cta: 'Explore MCP',
    href: '/mcp',
    highlighted: true,
  },
  {
    name: 'Production Readiness',
    status: 'Next',
    description:
      'After funded-wallet proof from the browser, the app is ready for deployment hardening.',
    features: [
      'Register production CSPR.click appId',
      'Capture explorer hashes in report',
      'Resolve or document indexer lag',
      'Run Lighthouse before deploy',
    ],
    cta: 'View History',
    href: '/activity',
    highlighted: false,
  },
]

export default function Pricing() {
  return (
    <SectionShell id="evidence">
      <div className="border-b border-white/10 px-6 py-12 text-center sm:px-10 lg:px-14 lg:py-16">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Testnet Evidence &amp; Readiness
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-zinc-500 sm:text-base">
          MERIDIAN is wired to real contract addresses, backend indexes, the MCP explorer, and
          x402 services. These are the current integration gates.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3">
        {phases.map((plan) => (
          <article
            key={plan.name}
            className={`group relative flex min-h-[520px] flex-col overflow-hidden border-b border-r border-white/10 bg-black p-8 transition-colors duration-300 lg:min-h-[560px] lg:p-10 ${
              plan.highlighted ? 'lg:-mt-0' : ''
            }`}
          >
            {plan.highlighted && (
              <>
                <div aria-hidden className="pointer-events-none absolute inset-0 opacity-100">
                  <div className="absolute -bottom-28 -right-28 h-80 w-80 rounded-full bg-red-600/30 blur-[90px]" />
                  <div className="absolute bottom-0 right-0 h-full w-full bg-[radial-gradient(circle_at_88%_92%,rgba(248,113,113,0.28)_0%,rgba(220,38,38,0.12)_38%,transparent_72%)]" />
                </div>
                <span className="relative z-10 mb-6 inline-flex w-fit rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1 text-xs font-medium text-red-300">
                  Core workflow
                </span>
              </>
            )}

            <div className="relative z-10">
              <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
              <p className="mt-2 text-sm text-zinc-500">{plan.description}</p>

              <div className="mt-8">
                <span className="text-4xl font-bold tracking-tight text-white">{plan.status}</span>
              </div>
              <p className="mt-1 text-sm text-zinc-600">Current integration state</p>
            </div>

            <ul className="relative z-10 mt-8 flex-1 space-y-3">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm text-zinc-400">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-zinc-600" />
                  {feature}
                </li>
              ))}
            </ul>

            <a
              href={plan.href}
              className={`relative z-10 mt-8 inline-flex items-center justify-center rounded-md px-5 py-2.5 text-sm font-medium transition ${
                plan.highlighted
                  ? 'border border-white/20 bg-white text-black hover:bg-red-50'
                  : 'border border-white/20 text-white hover:border-red-500/60 hover:bg-red-500/10'
              }`}
            >
              {plan.cta}
            </a>
          </article>
        ))}
      </div>
    </SectionShell>
  )
}
