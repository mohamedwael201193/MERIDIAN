'use client'

import dynamic from 'next/dynamic'
import type { ReactNode } from 'react'
import { Box, CircularProgress } from '@mui/material'

const DashboardLayout = dynamic(() => import('@/dashboard/layouts/DashboardLayout'), {
  ssr: false,
  loading: () => (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#0a0a0a',
      }}
    >
      <CircularProgress color="primary" />
    </Box>
  ),
})

export default function DashboardShellLayout({ children }: { children: ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>
}
