import { Code2, Globe, Mail, MapPin } from 'lucide-react'
import Logo from '@/components/Logo'
import { FooterBackgroundGradient, TextHoverEffect } from '@/components/ui/hover-footer'

const footerLinks = [
  {
    title: 'Product',
    links: [
      { label: 'Production Stack', href: '#features' },
      { label: 'Workflows', href: '#workflows' },
      { label: 'Evidence', href: '#evidence' },
      { label: 'Dashboard', href: '/dashboard' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'FAQ', href: '#faq' },
      { label: 'MCP Tools', href: '/mcp' },
      { label: 'x402 Flow', href: '/x402' },
      { label: 'Audit Trail', href: '/audit' },
    ],
  },
]

const contactInfo = [
  {
    icon: <Mail size={18} className="text-red-500" />,
    text: 'frontend report ready',
    href: '#evidence',
  },
  {
    icon: <MapPin size={18} className="text-red-500" />,
    text: 'Casper Network',
  },
  {
    icon: <Globe size={18} className="text-red-500" />,
    text: 'Testnet deployment live',
    href: '#cta',
  },
]

const socialLinks = [
  { icon: <Code2 size={20} />, label: 'GitHub', href: 'https://github.com' },
  { icon: <Globe size={20} />, label: 'Casper', href: 'https://casper.network' },
]

export default function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-black">
      <div className="relative z-10 mx-auto max-w-7xl border-x border-white/10 px-6 py-14 sm:px-8 lg:px-10">
        <div className="grid grid-cols-1 gap-12 pb-12 md:grid-cols-2 lg:grid-cols-4 lg:gap-16">
          <div className="flex flex-col space-y-4">
            <Logo size="lg" showWordmark />
            <p className="text-sm leading-relaxed text-zinc-500">
              Casper-native RWA infrastructure with live contracts, backend-indexed data,
              wallet-signed transactions, MCP tools, x402 paid resources, and AI agent evidence.
            </p>
          </div>

          {footerLinks.map((section) => (
            <div key={section.title}>
              <h4 className="mb-6 text-sm font-semibold uppercase tracking-wider text-white">
                {section.title}
              </h4>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-zinc-500 transition-colors hover:text-red-400"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h4 className="mb-6 text-sm font-semibold uppercase tracking-wider text-white">
              Contact
            </h4>
            <ul className="space-y-4">
              {contactInfo.map((item, i) => (
                <li key={i} className="flex items-center space-x-3">
                  {item.icon}
                  {item.href ? (
                    <a
                      href={item.href}
                      className="text-sm text-zinc-500 transition-colors hover:text-red-400"
                    >
                      {item.text}
                    </a>
                  ) : (
                    <span className="text-sm text-zinc-500">{item.text}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <hr className="my-8 border-white/10" />

        <div className="flex flex-col items-center justify-between gap-4 text-sm md:flex-row">
          <div className="flex space-x-6 text-zinc-600">
            {socialLinks.map(({ icon, label, href }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                className="transition-colors hover:text-red-400"
                target="_blank"
                rel="noreferrer"
              >
                {icon}
              </a>
            ))}
          </div>

          <p className="text-center text-zinc-600 md:text-left">
            © {new Date().getFullYear()} MERIDIAN. All rights reserved.
          </p>

          <div className="flex gap-6">
            <a href="#" className="text-zinc-600 transition-colors hover:text-red-400">
              Testnet only
            </a>
            <a href="#" className="text-zinc-600 transition-colors hover:text-red-400">
              Manual wallet sign-off pending
            </a>
          </div>
        </div>
      </div>

      <div className="relative z-10 hidden h-[28rem] lg:-mt-48 lg:-mb-32 lg:flex">
        <TextHoverEffect text="MERIDIAN" className="z-50" />
      </div>

      <FooterBackgroundGradient />
    </footer>
  )
}
