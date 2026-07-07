'use client'

import { ReactElement, ReactNode } from 'react'
import { Box, BoxProps } from '@mui/material'
import { motion } from 'motion/react'
import { meridianTokens } from '@/design/tokens'

interface GlassCardProps extends Omit<BoxProps, 'children'> {
  children: ReactNode
  hover?: boolean
  glow?: boolean
  animate?: boolean
  padding?: number | string
}

export default function GlassCard({
  children,
  hover = false,
  glow = false,
  animate = false,
  padding = 3,
  sx,
  ...rest
}: GlassCardProps): ReactElement {
  const base = (
    <Box
      sx={{
        borderRadius: `${meridianTokens.radius.lg}px`,
        bgcolor: meridianTokens.color.glass,
        border: '1px solid',
        borderColor: meridianTokens.color.glassBorder,
        boxShadow: glow ? meridianTokens.shadow.glow : meridianTokens.shadow.card,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        p: padding,
        transition: 'box-shadow 0.3s ease, border-color 0.3s ease, transform 0.3s ease',
        ...(hover
          ? {
              cursor: 'pointer',
              '&:hover': {
                borderColor: 'rgba(220,38,38,0.35)',
                boxShadow: meridianTokens.shadow.cardHover,
                transform: 'translateY(-2px)',
              },
            }
          : {}),
        ...sx,
      }}
      {...rest}
    >
      {children}
    </Box>
  )

  if (!animate) return base

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={meridianTokens.motion.spring}
      style={{ height: '100%' }}
    >
      {base}
    </motion.div>
  )
}
