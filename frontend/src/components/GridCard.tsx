import type { ReactNode } from 'react'

export interface GridCardProps {
  title: string
  description: string
  icon?: ReactNode
  cta?: string
  ctaHref?: string
  className?: string
}

export default function GridCard({
  title,
  description,
  icon,
  cta,
  ctaHref = '#cta',
  className = '',
}: GridCardProps) {
  return (
    <article
      className={`group relative flex min-h-[360px] flex-col overflow-hidden border-b border-r border-white/10 bg-black p-8 transition-colors duration-300 sm:min-h-[400px] lg:min-h-[420px] lg:p-10 ${className}`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
      >
        <div className="absolute -bottom-28 -right-28 h-80 w-80 rounded-full bg-red-600/45 blur-[90px]" />
        <div className="absolute bottom-0 right-0 h-full w-full bg-[radial-gradient(circle_at_88%_92%,rgba(248,113,113,0.4)_0%,rgba(220,38,38,0.18)_38%,rgba(69,10,10,0.08)_58%,transparent_72%)]" />
      </div>

      <div className="relative z-10 flex flex-1 flex-col">
        {icon && (
          <div className="mb-10 text-zinc-600 transition-colors duration-300 group-hover:text-red-400/90">
            {icon}
          </div>
        )}

        <h3 className="text-lg font-semibold tracking-tight text-white sm:text-xl">{title}</h3>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-zinc-500">{description}</p>

        {cta && (
          <a
            href={ctaHref}
            className="mt-10 inline-flex w-fit items-center justify-center rounded-md border border-white/20 px-5 py-2.5 text-sm font-medium text-white transition hover:border-red-500/60 hover:bg-red-500/10"
          >
            {cta}
          </a>
        )}
      </div>
    </article>
  )
}
