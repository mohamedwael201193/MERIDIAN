import SectionShell from './SectionShell';

const useCases = [
  {
    step: '01',
    title: 'Read live protocol state',
    description: 'Landing, dashboard, audit, and agents pages read tokens, holders, events, yields, and decisions through backend proxies.',
  },
  {
    step: '02',
    title: 'Connect a wallet',
    description: 'CSPR.click initializes Casper Wallet on testnet and keeps account state available across landing and dashboard routes.',
  },
  {
    step: '03',
    title: 'Build unsigned transactions',
    description: 'MCP write tools create TransactionV1 payloads for issue, transfer, holder registration, revoke, restake, and rewards.',
  },
  {
    step: '04',
    title: 'Sign and submit',
    description: 'Users review a transaction card, sign in Casper Wallet, submit through casper-js-sdk, and track finality.',
  },
  {
    step: '05',
    title: 'Unlock paid resources',
    description: 'x402 requests return payment terms, verify wallet-signed proof, and unlock resource data after settlement.',
  },
  {
    step: '06',
    title: 'Audit every action',
    description: 'Agent decisions, indexed contract events, and explorer links give operators a readable trail of real activity.',
  },
];

export default function UseCases() {
  return (
    <SectionShell id="workflows">
      <div className="border-b border-white/10 px-6 py-12 text-center sm:px-10 lg:px-14 lg:py-16">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          How MERIDIAN Works
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-zinc-500 sm:text-base">
          A practical path from live data to wallet-signed transactions, with no custodial
          keys and no fabricated blockchain state.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {useCases.map(item => (
          <article
            key={item.title}
            className="group relative min-h-[230px] overflow-hidden border-b border-r border-red-950/40 bg-[radial-gradient(circle_at_20%_100%,rgba(220,38,38,0.22),transparent_44%),linear-gradient(145deg,rgba(127,29,29,0.18),rgba(0,0,0,0.96)_48%)] p-7 transition-all duration-500 hover:-translate-y-1 hover:border-red-500/60 hover:bg-black hover:shadow-2xl hover:shadow-red-950/30 sm:min-h-[250px] lg:min-h-[270px] lg:p-8"
          >
            <div
              aria-hidden
              className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_22%,rgba(220,38,38,0.32),transparent_36%)]" />
              <div className="absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-red-500/80 to-transparent" />
            </div>
            <div className="relative z-10 flex h-full flex-col justify-between">
              <div>
                <div className="mb-7 flex items-center justify-between">
                  <span className="rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-300 transition-colors duration-300 group-hover:bg-red-500 group-hover:text-white">
                    {item.step}
                  </span>
                  <span className="h-2 w-2 rounded-full bg-red-500/60 shadow-[0_0_18px_rgba(239,68,68,0.75)] transition-transform duration-300 group-hover:scale-150" />
                </div>
                <h3 className="text-xl font-semibold tracking-tight text-white transition-colors duration-300 group-hover:text-red-100">
                  {item.title}
                </h3>
                <p className="mt-4 max-w-sm text-sm leading-relaxed text-zinc-400 transition-colors duration-300 group-hover:text-zinc-300">
                  {item.description}
                </p>
              </div>
              <div className="mt-8 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.24em] text-red-400/60 transition-colors duration-300 group-hover:text-red-300">
                <span>Live flow</span>
                <span className="h-px flex-1 bg-gradient-to-r from-red-500/50 to-transparent" />
              </div>
            </div>
          </article>
        ))}
      </div>
    </SectionShell>
  );
}
