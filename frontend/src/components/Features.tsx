import { useRef } from 'react'
import CarouselControls from './CarouselControls'
import GridCard from './GridCard'
import SectionShell from './SectionShell'
import { AgentIcon, ComplianceIcon, McpIcon, StakingIcon } from './FeatureIcons'

const features = [
  {
    title: 'Live Casper Contracts',
    description:
      'Five Odra contracts are deployed on casper-test and surfaced through live backend APIs.',
    icon: <StakingIcon />,
  },
  {
    title: 'Compliance-first Holders',
    description:
      'Holder registration, compliance status, revocation logic, and audit events are indexed from the MERIDIAN contract stack.',
    icon: <ComplianceIcon />,
  },
  {
    title: 'AI Decision Feed',
    description:
      'Yield, compliance, and audit agents publish structured decisions that the frontend displays as live operational evidence.',
    icon: <AgentIcon />,
  },
  {
    title: 'MCP + x402 Workflows',
    description:
      'MCP builds unsigned TransactionV1 payloads for wallet signing, while x402 gates paid resources with Casper payments.',
    icon: <McpIcon />,
  },
]

export default function Features() {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: 'prev' | 'next') => {
    const el = scrollRef.current
    if (!el) return
    const amount = direction === 'next' ? el.clientWidth * 0.85 : -el.clientWidth * 0.85
    el.scrollBy({ left: amount, behavior: 'smooth' })
  }

  return (
    <SectionShell id="features">
      <div className="flex flex-col gap-8 border-b border-white/10 px-6 py-12 sm:flex-row sm:items-end sm:justify-between sm:px-10 lg:px-14 lg:py-16">
        <div className="max-w-xl">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Production Stack
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-zinc-500 sm:text-base">
            The frontend connects a real Casper testnet deployment to indexed backend data, wallet
            signing, MCP tool execution, and x402 resource access.
          </p>
        </div>
        <CarouselControls onPrev={() => scroll('prev')} onNext={() => scroll('next')} />
      </div>

      <div
        ref={scrollRef}
        className="grid grid-cols-1 overflow-x-auto sm:grid-cols-2 lg:grid-cols-4 lg:overflow-visible"
      >
        {features.map((feature) => (
          <GridCard
            key={feature.title}
            title={feature.title}
            description={feature.description}
            icon={feature.icon}
            cta="Open dashboard"
            ctaHref="/dashboard"
          />
        ))}
      </div>
    </SectionShell>
  )
}
