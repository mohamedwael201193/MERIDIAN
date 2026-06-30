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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body id="root">
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  )
}
