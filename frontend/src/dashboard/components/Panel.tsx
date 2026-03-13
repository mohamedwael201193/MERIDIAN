import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PanelProps {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export default function Panel({ title, description, action, children, className }: PanelProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-white/10 bg-dashboard-card shadow-card',
        className,
      )}
    >
      <div className="flex items-start justify-between border-b border-white/10 px-6 py-4">
        <div>
          <h3 className="text-base font-semibold text-white">{title}</h3>
          {description && <p className="mt-0.5 text-sm text-zinc-500">{description}</p>}
        </div>
        {action}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}
