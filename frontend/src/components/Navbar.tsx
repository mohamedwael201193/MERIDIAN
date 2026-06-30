'use client'

import Link from 'next/link'
import Logo from './Logo'
import LandingWalletButton from './LandingWalletButton'

const navLinks = [
  { label: 'Home', href: '#home' },
  { label: 'Features', href: '#features' },
  { label: 'Workflows', href: '#workflows' },
  { label: 'Evidence', href: '#evidence' },
  { label: 'FAQ', href: '#faq' },
]

export default function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-black/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between border-x border-white/10 px-4 sm:px-6 lg:px-8">
        <Logo size="sm" showWordmark href="/#home" />

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-zinc-400 transition-colors hover:text-white"
            >
              {link.label}
            </a>
          ))}
          <Link
            href="/dashboard"
            className="text-sm font-medium text-zinc-400 transition-colors hover:text-red-400"
          >
            Dashboard
          </Link>
        </nav>

        <div className="flex items-center gap-3 sm:gap-4">
          <LandingWalletButton />
          <Link
            href="/dashboard"
            className="inline-flex items-center rounded-md border border-white/20 px-4 py-2 text-sm font-medium text-white transition hover:border-red-500/50 hover:bg-red-500/10"
          >
            Open Dashboard
          </Link>
        </div>
      </div>
    </header>
  )
}
