import { Box, Skeleton, Stack } from '@mui/material'
import { meridianTokens } from '@/design/tokens'

function SkeletonCard() {
  return (
    <Box
      sx={{
        p: 2.5,
        borderRadius: 3,
        bgcolor: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <Skeleton width="40%" height={14} sx={{ bgcolor: 'rgba(255,255,255,0.06)', mb: 1.5 }} />
      <Skeleton width="70%" height={28} sx={{ bgcolor: 'rgba(255,255,255,0.06)' }} />
      <Skeleton width="90%" height={16} sx={{ bgcolor: 'rgba(255,255,255,0.04)', mt: 1 }} />
    </Box>
  )
}

export default function DashboardLoading() {
  return (
    <Box maxWidth={1280} mx="auto" py={2}>
      <Skeleton variant="rounded" height={40} sx={{ mb: 3, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.04)' }} />
      <Skeleton width="45%" height={40} sx={{ mb: 1, bgcolor: 'rgba(255,255,255,0.06)' }} />
      <Skeleton width="30%" height={20} sx={{ mb: 3, bgcolor: 'rgba(255,255,255,0.04)' }} />
      <Box
        display="grid"
        gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }}
        gap={meridianTokens.spacing.panelGap}
        mb={meridianTokens.spacing.sectionGap}
      >
        {[0, 1, 2, 3].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </Box>
      <Stack gap={meridianTokens.spacing.panelGap}>
        <Skeleton variant="rounded" height={56} sx={{ borderRadius: 4, bgcolor: 'rgba(255,255,255,0.04)' }} />
      </Stack>
    </Box>
  )
}
