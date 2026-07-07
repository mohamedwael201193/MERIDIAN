import type { Metadata } from 'next'
import '../index.css'
import '@/nickelfox/index.css'
import ClientProviders from '@/providers/ClientProviders'

export const metadata: Metadata = {
  title: 'MERIDIAN — Autonomous Compliant Yield for RWAs',
  description: 'Casper-native RWA platform with native staking yield, compliance, and AI agents.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/logo.svg" type="image/svg+xml" />
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="" />
        <link href="https://cdn.jsdelivr.net/npm/geist@1.3.1/dist/fonts/geist-sans/style.css" rel="stylesheet" />
        <link href="https://cdn.jsdelivr.net/npm/geist@1.3.1/dist/fonts/geist-mono/style.css" rel="stylesheet" />
      </head>
      <body id="root" style={{ fontFamily: 'Geist, system-ui, sans-serif' }}>
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  )
}
