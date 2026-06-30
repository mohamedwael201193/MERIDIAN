import { Box, CircularProgress, Stack, Typography } from '@mui/material'

export default function DashboardLoading() {
  return (
    <Box
      sx={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Stack alignItems="center" gap={2}>
        <CircularProgress color="primary" />
        <Typography variant="body2" color="text.secondary">
          Loading MERIDIAN dashboard…
        </Typography>
      </Stack>
    </Box>
  )
}
