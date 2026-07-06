import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { config } from 'dotenv'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

config({ path: path.resolve(__dirname, '../.env') })

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compiler: {
    styledComponents: true,
  },
  transpilePackages: [
    '@make-software/csprclick-ui',
    '@make-software/csprclick-core-client',
    '@make-software/csprclick-core-types',
  ],
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    outputFileTracingIncludes: {
      '/api/mcp': ['./../mcp-server/dist/**/*', './../deployed/addresses.json'],
      '/api/x402/resource/[resource]': ['./../packages/meridian-casper-sdk/dist/**/*'],
      '/api/x402/verify': ['./../packages/meridian-casper-sdk/dist/**/*'],
      '/api/x402/settle': ['./../packages/meridian-casper-sdk/dist/**/*'],
      '/api/transactions/status/[hash]': ['./../packages/meridian-casper-sdk/dist/**/*'],
    },
  },
  async redirects() {
    return [
      { source: '/dashboard/staking', destination: '/staking', permanent: false },
      { source: '/dashboard/compliance', destination: '/compliance', permanent: false },
      { source: '/dashboard/agents', destination: '/agents', permanent: false },
      { source: '/dashboard/audit', destination: '/audit', permanent: false },
      { source: '/dashboard/mcp', destination: '/mcp', permanent: false },
      { source: '/dashboard/tokens', destination: '/issue', permanent: false },
      { source: '/dashboard/x402', destination: '/x402', permanent: false },
      { source: '/dashboard/issue', destination: '/issue', permanent: false },
      { source: '/dashboard/start', destination: '/start', permanent: false },
      { source: '/dashboard/playground', destination: '/playground', permanent: false },
      { source: '/dashboard/prompts', destination: '/prompts', permanent: false },
    ]
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ]
  },
}

export default nextConfig
