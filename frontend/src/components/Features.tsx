import { useRef } from 'react'
import CarouselControls from './CarouselControls'
import GridCard from './GridCard'
import SectionShell from './SectionShell'
import { AgentIcon, ComplianceIcon, McpIcon, StakingIcon } from './FeatureIcons'

const features = [
  {
    title: 'Briefing',
    description:
      'Live protocol metrics, status ribbon, and yield overview inside a unified command shell.',
    icon: <StakingIcon />,
    cta: 'Open Briefing',
    ctaHref: '/agent',
  },
  {
    title: 'Agents & History',
    description:
      'AI decision feed, agent profiles, and indexed on-chain activity across the workspace.',
    icon: <AgentIcon />,
    cta: 'View agents',
    ctaHref: '/agents',
  },
  {
    title: 'MCP Tool Explorer',
    description:
      'Search 13 tools, filter read vs write, run instant reads, and build unsigned transactions.',
    icon: <McpIcon />,
    cta: 'Explore tools',
    ctaHref: '/mcp',
  },
  {
    title: 'Templates & Missions',
    description:
      'Pre-built agent missions for compliance, yield, and audit workflows with one-click run.',
    icon: <ComplianceIcon />,
    cta: 'Browse templates',
    ctaHref: '/templates',
  },
  {
    title: 'Marketplace',
    description:
      'Discover installable agents, run defaults, and extend your autonomous operations stack.',
    icon: <AgentIcon />,
    cta: 'Open marketplace',
    ctaHref: '/marketplace',
  },
  {
    title: 'Operations',
    description:
      'Treasury charts, validator insights, and day-to-day protocol operations in one view.',
    icon: <StakingIcon />,
    cta: 'View operations',
    ctaHref: '/dashboard',
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
            Inside the App
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-zinc-500 sm:text-base">
            Workspace, Discover, and More — every page shares the same elevated panels, status
            ribbon, and wallet-aware flows across Briefing, agents, MCP, templates, and marketplace.
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
            cta={feature.cta}
            ctaHref={feature.ctaHref}
          />
        ))}
      </div>
    </SectionShell>
  )
}
