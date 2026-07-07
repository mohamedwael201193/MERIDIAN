'use client'

import Link from 'next/link'
import { Component } from '@/components/ui/gradient-bars-background'
import ProtocolStats from '@/components/ProtocolStats'

export default function Hero() {
  return (
    <Component
      id="home"
      numBars={9}
      gradientFrom="rgb(220, 38, 38)"
      gradientTo="transparent"
      animationDuration={2.4}
      backgroundColor="rgb(0, 0, 0)"
    >
      <div className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-4 pb-20 pt-28 text-center">
        <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.35em] text-red-400/70 sm:text-xs">
          Casper RWA infrastructure
        </p>

        <h1 className="text-balance font-black leading-[0.92] tracking-tighter text-white">
          <span className="block text-[clamp(3rem,10vw,6.25rem)]">MERIDIAN</span>
          <span className="mt-2 block bg-gradient-to-r from-red-300 via-red-500 to-red-700 bg-clip-text text-[clamp(1.85rem,5.5vw,3.5rem)] font-light italic text-transparent">
            compliant yield
          </span>
        </h1>

        <p className="mt-7 max-w-xl text-balance text-base leading-relaxed text-zinc-400 sm:text-lg">
          Live Casper contracts, indexed backend data, wallet-signed transactions, MCP tooling, and
          x402 paid resources in one production-oriented frontend.
        </p>

        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/agent"
            className="inline-flex min-w-[170px] items-center justify-center rounded-md bg-red-600 px-6 py-3 text-sm font-semibold text-white shadow-xl shadow-red-950/30 transition hover:bg-red-500"
          >
            Open live dashboard
          </Link>
          <a
            href="#evidence"
            className="inline-flex min-w-[170px] items-center justify-center rounded-md border border-white/20 px-6 py-3 text-sm font-medium text-white transition hover:border-red-500/60 hover:bg-red-500/10"
          >
            View testnet evidence
          </a>
        </div>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-zinc-600">
          <span>5 deployed contracts</span>
          <span className="hidden h-1 w-1 rounded-full bg-zinc-700 sm:inline" aria-hidden="true" />
          <span>Real backend data</span>
        </div>

        <ProtocolStats />
      </div>
    </Component>
  )
}
