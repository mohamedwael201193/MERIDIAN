import type { ReactNode } from 'react';
import Card from './Card';

interface WidgetProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
}

export default function Widget({ icon, title, subtitle }: WidgetProps) {
  return (
    <Card extra="!flex-row items-center !py-4 transition-shadow hover:shadow-panel-hover">
      <div className="ml-[18px] flex shrink-0 items-center">
        <div className="rounded-full border border-brand-500/20 bg-[#1e1e2a] p-3">
          <span className="flex items-center text-brand-500">{icon}</span>
        </div>
      </div>
      <div className="min-w-0 flex-1 py-1 pr-4">
        <p className="font-dm text-sm font-medium text-gray-600">{title}</p>
        <h4 className="truncate text-xl font-bold text-white">{subtitle}</h4>
      </div>
    </Card>
  );
}
