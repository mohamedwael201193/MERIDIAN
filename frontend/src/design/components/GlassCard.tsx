'use client'

import { ReactElement, ReactNode } from 'react'
import { Box, BoxProps } from '@mui/material'
import { motion } from 'motion/react'
import { meridianTokens } from '@/design/tokens'
import { panelSurfaceSx } from '@/design/surface'

interface GlassCardProps extends Omit<BoxProps, 'children'> {
  children: ReactNode
  hover?: boolean
  glow?: boolean
  elevated?: boolean
  animate?: boolean
  padding?: number | string
  /** Disable animated spark line (static glass only) */
  spark?: boolean
}

export default function GlassCard({
  children,
  hover = false,
  glow = false,
  elevated = true,
  animate = false,
  spark = true,
  padding = meridianTokens.spacing.panelPadding,
  sx,
  ...rest
}: GlassCardProps): ReactElement {
  const surface = panelSurfaceSx({
    spark,
    hover,
    nested: !elevated,
  })

  const base = (
    <Box
      sx={{
        borderRadius: `${meridianTokens.radius.lg}px`,
        p: padding,
        ...surface,
        ...(glow ? { boxShadow: meridianTokens.shadow.glow } : {}),
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
