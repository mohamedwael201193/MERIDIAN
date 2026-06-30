import type { ReactNode } from 'react'

interface SectionShellProps {
  id?: string
  children: ReactNode
  className?: string
}

export default function SectionShell({ id, children, className = '' }: SectionShellProps) {
  return (
    <section id={id} className={`border-t border-white/10 bg-black ${className}`}>
      <div className="mx-auto max-w-7xl border-x border-white/10">{children}</div>
    </section>
  )
}
