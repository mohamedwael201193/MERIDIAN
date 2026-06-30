import { ReactElement } from 'react'
import { Box, Card, Stack, Typography, CardContent, Chip, Link as MuiLink } from '@mui/material'
import IconifyIcon from '@/nickelfox/components/base/IconifyIcon'

export interface TrendingItem {
  id: number
  name: string
  contractName: string
  packageHash: string
  symbol: string
  link: string
}

const SlideItem = ({ trendingItem }: { trendingItem: TrendingItem }): ReactElement => {
  const shortHash = `${trendingItem.packageHash.slice(0, 18)}…`

  return (
    <Card
      sx={{
        bgcolor: 'background.default',
        height: 1,
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Stack direction="row" alignItems="center" gap={1.5} mb={2}>
          <IconifyIcon icon="mdi:token" width={28} height={28} color="primary.main" />
          <Box>
            <Typography variant="h6" color="common.white">
              {trendingItem.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {trendingItem.contractName}
            </Typography>
          </Box>
        </Stack>
        <Stack gap={1.5}>
          <Chip size="small" label={trendingItem.symbol} color="primary" variant="outlined" />
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}
          >
            {shortHash}
          </Typography>
          <MuiLink
            href={trendingItem.link}
            target="_blank"
            rel="noreferrer"
            variant="body2"
            color="primary.light"
          >
            Open in explorer
          </MuiLink>
        </Stack>
      </CardContent>
    </Card>
  )
}

export default SlideItem
