'use client'

import {
  IconButton,
  Paper,
  Stack,
  Typography,
  CircularProgress,
  Box,
  Link as MuiLink,
} from '@mui/material'
import IconifyIcon from '@/nickelfox/components/base/IconifyIcon'
import ReactSwiper from '@/nickelfox/components/base/ReactSwiper'
import { ReactElement, useMemo, useState } from 'react'
import { SwiperSlide } from 'swiper/react'
import { Swiper as SwiperClass } from 'swiper/types'
import SlideItem from './SlideItem'
import { useTokens } from '@lib/hooks/useMeridianData'
import { explorerContractUrl } from '@lib/contracts'

const TrendingNow = (): ReactElement => {
  const [, setSwiperRef] = useState<SwiperClass>()
  const { data: tokens, isLoading } = useTokens()

  const trendingItemsSlides = useMemo(
    () =>
      (tokens ?? []).map((token, index) => ({
        id: index + 1,
        name: token.symbol ?? token.contract_name,
        contractName: token.contract_name,
        packageHash: token.package_hash,
        symbol: token.symbol ?? 'MRWA',
        link: explorerContractUrl(token.package_hash),
      })),
    [tokens],
  )

  return (
    <Paper sx={{ p: { xs: 4, sm: 8 }, height: 1 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={5}
        mr={-2}
        flexWrap="wrap"
      >
        <Box>
          <Typography variant="h4" color="common.white">
            Deployed Contracts
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Live tokens indexed from the Render backend
          </Typography>
        </Box>
        <Stack direction="row" gap={1}>
          <IconButton
            className="prev-arrow"
            sx={{ '&:hover': { bgcolor: 'transparent' } }}
            centerRipple
          >
            <IconifyIcon icon="mingcute:left-line" />
          </IconButton>
          <IconButton
            className="next-arrow"
            sx={{ '&:hover': { bgcolor: 'transparent' } }}
            centerRipple
          >
            <IconifyIcon icon="mingcute:right-line" />
          </IconButton>
        </Stack>
      </Stack>
      {isLoading ? (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress color="primary" />
        </Box>
      ) : trendingItemsSlides.length === 0 ? (
        <Typography color="text.secondary">No indexed tokens to display.</Typography>
      ) : (
        <ReactSwiper onSwiper={setSwiperRef} sx={{ height: 1 }}>
          {trendingItemsSlides.map((slideItem) => (
            <SwiperSlide key={slideItem.id}>
              <SlideItem trendingItem={slideItem} />
            </SwiperSlide>
          ))}
        </ReactSwiper>
      )}
      {!isLoading && trendingItemsSlides.length > 0 ? (
        <MuiLink
          href={trendingItemsSlides[0]?.link}
          target="_blank"
          rel="noreferrer"
          variant="caption"
          color="primary.light"
          sx={{ display: 'inline-block', mt: 2 }}
        >
          View on testnet explorer
        </MuiLink>
      ) : null}
    </Paper>
  )
}

export default TrendingNow
