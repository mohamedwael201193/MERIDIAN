'use client'

import { ReactElement, ReactNode } from 'react'
import { CssBaseline, Fade, ThemeProvider } from '@mui/material'
import { usePathname } from 'next/navigation'
import '@/nickelfox/index.css'
import MainLayout from '@/nickelfox/layouts/main-layout'
import BreakpointsProvider from '@/nickelfox/providers/BreakpointsProvider'
import theme from '@/nickelfox/theme/theme'

export default function DashboardLayout({ children }: { children: ReactNode }): ReactElement {
  const pathname = usePathname()
  return (
    <ThemeProvider theme={theme}>
      <BreakpointsProvider>
        <CssBaseline />
        <MainLayout>
          <Fade in key={pathname} timeout={220}>
            <div>{children}</div>
          </Fade>
        </MainLayout>
      </BreakpointsProvider>
    </ThemeProvider>
  )
}
