import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: ReactNode;
  trend?: string;
  className?: string;
}

export default function StatCard({ title, value, subtitle, icon, trend, className }: StatCardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-white/10 bg-dashboard-card p-5 shadow-card transition hover:border-red-500/30',
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-600/10 text-red-500">
          {icon}
        </div>
        {trend && (
          <span className="rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-400">
            {trend}
          </span>
        )}
      </div>
      <p className="mt-4 text-sm text-zinc-500">{title}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight text-white">{value}</p>
      {subtitle && <p className="mt-1 text-xs text-zinc-600">{subtitle}</p>}
    </div>
  );
}
