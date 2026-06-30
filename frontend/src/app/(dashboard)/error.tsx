'use client'

import { Alert, Box, Button, Stack, Typography } from '@mui/material'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <Box sx={{ py: 8 }}>
      <Stack gap={2} maxWidth={560}>
        <Typography variant="h4" color="common.white">
          Dashboard unavailable
        </Typography>
        <Alert severity="error">{error.message || 'Something went wrong loading this page.'}</Alert>
        <Button variant="contained" onClick={reset} sx={{ alignSelf: 'flex-start' }}>
          Try again
        </Button>
      </Stack>
    </Box>
  )
}
