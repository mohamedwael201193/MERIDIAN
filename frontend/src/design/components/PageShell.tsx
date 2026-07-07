'use client'

import { ReactElement, ReactNode } from 'react'
import { Box } from '@mui/material'
import StatusRibbon from '@/design/components/StatusRibbon'
import { meridianTokens } from '@/design/tokens'

export default function PageShell({ children }: { children: ReactNode }): ReactElement {
  return (
    <Box maxWidth={meridianTokens.spacing.pageMax} mx="auto">
      <StatusRibbon />
      {children}
    </Box>
  )
}
