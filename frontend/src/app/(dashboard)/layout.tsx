import type { ReactNode } from 'react';
import DashboardShellLayout from './DashboardShellLayout';

export const dynamic = 'force-dynamic';

export default function DashboardGroupLayout({ children }: { children: ReactNode }) {
  return <DashboardShellLayout>{children}</DashboardShellLayout>;
}
