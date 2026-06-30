import Link from 'next/link'
import SectionShell from './SectionShell'

export default function CtaBanner() {
  return (
    <SectionShell id="cta">
      <div className="relative overflow-hidden px-6 py-20 text-center sm:px-10 lg:px-14 lg:py-24">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(220,38,38,0.12)_0%,transparent_55%)]"
        />
        <div className="relative z-10">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to test the live dApp?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-zinc-500 sm:text-base">
            Connect Casper Wallet on testnet, review live indexed data, invoke MCP tools, and
            complete the remaining funded-wallet transaction checks.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/dashboard"
              className="inline-flex min-w-[160px] items-center justify-center rounded-md border border-white/20 bg-white px-6 py-3 text-sm font-medium text-black transition hover:bg-red-50"
            >
              Open Dashboard
            </Link>
            <a
              href="#workflows"
              className="inline-flex min-w-[160px] items-center justify-center rounded-md border border-white/20 px-6 py-3 text-sm font-medium text-white transition hover:border-red-500/60 hover:bg-red-500/10"
            >
              Review workflows
            </a>
          </div>
        </div>
      </div>
    </SectionShell>
  )
}
