'use client'

import { ReactElement, ReactNode, useState } from 'react'
import { Button, ButtonProps, CircularProgress } from '@mui/material'
import { motion } from 'motion/react'
import IconifyIcon from '@/nickelfox/components/base/IconifyIcon'
import { meridianTokens } from '@/design/tokens'

type ButtonState = 'idle' | 'loading' | 'success' | 'failure'

interface PremiumButtonProps extends Omit<ButtonProps, 'children'> {
  children: ReactNode
  loading?: boolean
  success?: boolean
  failure?: boolean
  icon?: string
}

export default function PremiumButton({
  children,
  loading,
  success,
  failure,
  icon,
  disabled,
  sx,
  ...rest
}: PremiumButtonProps): ReactElement {
  const [pressed, setPressed] = useState(false)
  const state: ButtonState = loading ? 'loading' : success ? 'success' : failure ? 'failure' : 'idle'

  return (
    <motion.div
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      transition={meridianTokens.motion.spring}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      style={{ display: 'inline-flex' }}
    >
      <Button
        disabled={disabled || loading}
        sx={{
          borderRadius: `${meridianTokens.radius.md}px`,
          textTransform: 'none',
          fontWeight: 600,
          fontSize: 15,
          px: 2.5,
          py: 1.25,
          boxShadow: pressed ? 'none' : '0 2px 12px rgba(220,38,38,0.25)',
          transition: 'background-color 0.2s, box-shadow 0.2s',
          ...(state === 'success'
            ? { bgcolor: meridianTokens.color.success, '&:hover': { bgcolor: '#16a34a' } }
            : {}),
          ...(state === 'failure'
            ? { bgcolor: meridianTokens.color.error, '&:hover': { bgcolor: '#dc2626' } }
            : {}),
          ...sx,
        }}
        startIcon={
          state === 'loading' ? (
            <CircularProgress size={18} color="inherit" />
          ) : state === 'success' ? (
            <IconifyIcon icon="mdi:check" width={18} />
          ) : state === 'failure' ? (
            <IconifyIcon icon="mdi:close" width={18} />
          ) : icon ? (
            <IconifyIcon icon={icon} width={18} />
          ) : undefined
        }
        {...rest}
      >
        {children}
      </Button>
    </motion.div>
  )
}
