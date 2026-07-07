import { Box, Stack, Typography } from '@mui/material'
import Link from 'next/link'

export default function NotFound() {
  return (
    <Box
      sx={{
        minHeight: '70vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 3,
      }}
    >
      <Stack alignItems="center" textAlign="center" gap={2} maxWidth={420}>
        <Typography variant="h2" color="common.white" fontWeight={700} letterSpacing="-0.03em">
          404
        </Typography>
        <Typography variant="body1" color="text.secondary">
          This page does not exist in the MERIDIAN agent operating system.
        </Typography>
        <Typography
          component={Link}
          href="/agent"
          variant="body1"
          color="primary.main"
          sx={{ textDecoration: 'none', fontWeight: 600 }}
        >
          Return to briefing
        </Typography>
      </Stack>
    </Box>
  )
}
