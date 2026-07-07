import { Box, Grid, Skeleton, Stack } from '@mui/material'

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
      <Grid container spacing={2} mb={3}>
        {[0, 1, 2, 3].map((i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <SkeletonCard />
          </Grid>
        ))}
      </Grid>
      <Stack gap={2}>
        <Skeleton variant="rounded" height={56} sx={{ borderRadius: 4, bgcolor: 'rgba(255,255,255,0.04)' }} />
      </Stack>
    </Box>
  )
}
