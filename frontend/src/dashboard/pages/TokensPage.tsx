import { ReactElement } from 'react'
import { Box } from '@mui/material'
import TopProducts from '@/nickelfox/components/sections/dashboard/top-products/TopProducts'

export default function TokensPage(): ReactElement {
  return (
    <Box display="grid" gridTemplateColumns="repeat(12, 1fr)" gap={3.5}>
      <Box gridColumn="span 12">
        <TopProducts />
      </Box>
    </Box>
  )
}
