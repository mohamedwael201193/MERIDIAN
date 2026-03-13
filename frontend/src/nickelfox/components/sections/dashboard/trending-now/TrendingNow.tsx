'use client';

import { IconButton, Paper, Stack, Typography, CircularProgress, Box } from '@mui/material';
import IconifyIcon from '@/nickelfox/components/base/IconifyIcon';
import ReactSwiper from '@/nickelfox/components/base/ReactSwiper';
import { ReactElement, useMemo, useState } from 'react';
import { SwiperSlide } from 'swiper/react';
import { Swiper as SwiperClass } from 'swiper/types';
import SlideItem from './SlideItem';
import { useTokens } from '@lib/hooks/useMeridianData';
import { explorerContractUrl } from '@lib/contracts';

const TrendingNow = (): ReactElement => {
  const [, setSwiperRef] = useState<SwiperClass>();
  const { data: tokens, isLoading } = useTokens();

  const trendingItemsSlides = useMemo(
    () =>
      (tokens ?? []).map((token, index) => ({
        id: index + 1,
        name: token.symbol ?? token.contract_name,
        imgsrc: `https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=800&q=80&sig=${index}`,
        popularity: Math.min(99, 40 + index * 12),
        users: [token.contract_name.slice(0, 12), token.symbol ?? 'MRWA'],
        link: explorerContractUrl(token.package_hash),
      })),
    [tokens],
  );

  return (
    <Paper sx={{ p: { xs: 4, sm: 8 }, height: 1 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={5} mr={-2} flexWrap="wrap">
        <Typography variant="h4" color="common.white">
          Featured RWAs
        </Typography>
        <Stack direction="row" gap={1}>
          <IconButton className="prev-arrow" sx={{ '&:hover': { bgcolor: 'transparent' } }} centerRipple>
            <IconifyIcon icon="mingcute:left-line" />
          </IconButton>
          <IconButton className="next-arrow" sx={{ '&:hover': { bgcolor: 'transparent' } }} centerRipple>
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
          {trendingItemsSlides.map(slideItem => (
            <SwiperSlide key={slideItem.id}>
              <SlideItem trendingItem={slideItem} />
            </SwiperSlide>
          ))}
        </ReactSwiper>
      )}
    </Paper>
  );
};

export default TrendingNow;
