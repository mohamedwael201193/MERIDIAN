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
