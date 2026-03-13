'use client';

import { ReactElement, ReactNode } from 'react';
import { CssBaseline, ThemeProvider } from '@mui/material';
import '@/nickelfox/index.css';
import MainLayout from '@/nickelfox/layouts/main-layout';
import BreakpointsProvider from '@/nickelfox/providers/BreakpointsProvider';
import theme from '@/nickelfox/theme/theme';

export default function DashboardLayout({ children }: { children: ReactNode }): ReactElement {
  return (
    <ThemeProvider theme={theme}>
      <BreakpointsProvider>
        <CssBaseline />
        <MainLayout>{children}</MainLayout>
      </BreakpointsProvider>
    </ThemeProvider>
  );
}
