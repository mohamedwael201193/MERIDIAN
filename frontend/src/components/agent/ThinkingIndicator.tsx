'use client'

import { ReactElement } from 'react'
import { Box, keyframes, Typography } from '@mui/material'

const pulse = keyframes`
  0%, 100% { opacity: 0.4; transform: scale(0.95); }
  50% { opacity: 1; transform: scale(1); }
`

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`

export default function ThinkingIndicator({ label = 'Thinking' }: { label?: string }): ReactElement {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1 }}>
      <Box sx={{ display: 'flex', gap: 0.75 }}>
        {[0, 1, 2].map((i) => (
          <Box
            key={i}
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              bgcolor: 'primary.main',
              animation: `${pulse} 1.2s ease-in-out infinite`,
              animationDelay: `${String(i * 0.15)}s`,
            }}
          />
        ))}
      </Box>
      <Typography
        variant="body2"
        sx={{
          background: 'linear-gradient(90deg, #888 0%, #fff 50%, #888 100%)',
          backgroundSize: '200% 100%',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          color: 'transparent',
          animation: `${shimmer} 2s linear infinite`,
        }}
      >
        {label}…
      </Typography>
    </Box>
  )
}
