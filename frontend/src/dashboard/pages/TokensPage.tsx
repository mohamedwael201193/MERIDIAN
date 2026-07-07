import { ReactElement } from 'react'
import { Box } from '@mui/material'
import TopProducts from '@/nickelfox/components/sections/dashboard/top-products/TopProducts'
import { meridianTokens } from '@/design/tokens'

export default function TokensPage(): ReactElement {
  return (
    <Box display="grid" gridTemplateColumns="repeat(12, 1fr)" gap={meridianTokens.spacing.sectionGap}>
      <Box gridColumn="span 12">
        <TopProducts />
      </Box>
    </Box>
  )
}
