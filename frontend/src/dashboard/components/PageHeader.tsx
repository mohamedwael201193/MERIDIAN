interface PageHeaderProps {
  title: string
  description: string
}

export default function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div className="mb-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-500/80">Dashboard</p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight text-white">{title}</h1>
      <p className="mt-2 max-w-2xl text-sm text-zinc-500">{description}</p>
    </div>
  )
}
