import { ReactElement } from 'react'
import { Box, Stack, Typography } from '@mui/material'
import IconifyIcon from '@/nickelfox/components/base/IconifyIcon'
import { SaleItem } from '@/nickelfox/types/sale-item'
import { meridianTokens } from '@/design/tokens'
import { panelSurfaceSx } from '@/design/surface'

const SaleCard = ({ saleItem }: { saleItem: SaleItem }): ReactElement => {
  return (
    <Stack
      gap={2.5}
      p={meridianTokens.spacing.panelPadding}
      borderRadius={`${meridianTokens.radius.lg}px`}
      height={1}
      sx={panelSurfaceSx()}
    >
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: `${meridianTokens.radius.sm}px`,
          bgcolor: meridianTokens.color.accentMuted,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          alignSelf: 'flex-start',
        }}
      >
        <IconifyIcon icon={saleItem.icon} width={22} height={22} color={saleItem.color} />
      </Box>
      <Stack spacing={0.75} alignItems="flex-start" width="100%">
        <Typography
          variant="h4"
          color="common.white"
          sx={{ lineHeight: 1.15, textAlign: 'left', width: '100%' }}
        >
          {saleItem.title}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'left', width: '100%' }}>
          {saleItem.subtitle}
        </Typography>
        {saleItem.detail ? (
          <Typography variant="body2" color="text.disabled" sx={{ textAlign: 'left', lineHeight: 1.4, width: '100%' }}>
            {saleItem.detail}
          </Typography>
        ) : null}
      </Stack>
    </Stack>
  )
}

export default SaleCard
