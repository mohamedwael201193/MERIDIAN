'use client'

import { useEffect, useState, ReactElement } from 'react'
import { Box, IconButton, Typography, keyframes } from '@mui/material'
import { motion, AnimatePresence } from 'motion/react'
import IconifyIcon from '@/nickelfox/components/base/IconifyIcon'
import { meridianTokens } from '@/design/tokens'
import { panelSurfaceSx } from '@/design/surface'

const ringPulse = keyframes`
  0%, 100% { transform: scale(1); opacity: 0.55; }
  50% { transform: scale(1.12); opacity: 0; }
`

interface ChatScrollHintProps {
  targetRef: React.RefObject<HTMLElement | null>
  onFocusChat?: () => void
}

export default function ChatScrollHint({ targetRef, onFocusChat }: ChatScrollHintProps): ReactElement | null {
  const [showFab, setShowFab] = useState(false)
  const [sliding, setSliding] = useState(false)

  useEffect(() => {
    const target = targetRef.current
    if (!target) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!sliding) setShowFab(!entry.isIntersecting)
      },
      { threshold: 0.12, rootMargin: '0px 0px -32px 0px' },
    )

    observer.observe(target)
    return () => observer.disconnect()
  }, [targetRef, sliding])

  const openChat = () => {
    if (sliding) return
    setSliding(true)
    targetRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    onFocusChat?.()
    window.setTimeout(() => {
      setSliding(false)
      setShowFab(false)
    }, 700)
  }

  return (
    <AnimatePresence>
      {showFab ? (
        <Box
          component={motion.div}
          initial={{ opacity: 0, y: 16, scale: 0.92 }}
          animate={
            sliding
              ? { opacity: 0, y: 120, x: -24, scale: 0.85 }
              : { opacity: 1, y: 0, x: 0, scale: 1 }
          }
          exit={{ opacity: 0, y: 16, scale: 0.92 }}
          transition={{ duration: sliding ? 0.65 : 0.35, ease: [0.22, 1, 0.36, 1] }}
          sx={{
            position: 'fixed',
            right: { xs: 20, sm: 28 },
            bottom: { xs: 24, sm: 32 },
            zIndex: 29,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: 1.25,
          }}
        >
          <Box
            sx={{
              px: 2,
              py: 1.25,
              borderRadius: `${meridianTokens.radius.md}px`,
              ...panelSurfaceSx({ spark: true }),
              border: '1px solid rgba(153,27,27,0.4)',
              maxWidth: 200,
            }}
          >
            <StackRow>
              <IconifyIcon icon="mdi:robot-outline" width={16} color={meridianTokens.color.accent} />
              <Typography variant="caption" fontWeight={700} color="common.white" lineHeight={1.3}>
                Agent chat
              </Typography>
            </StackRow>
            <Typography variant="caption" color="text.secondary" display="block" mt={0.5} lineHeight={1.4}>
              Tap to jump to the command bar
            </Typography>
          </Box>

          <Box sx={{ position: 'relative' }}>
            <Box
              sx={{
                position: 'absolute',
                inset: -6,
                borderRadius: '50%',
                border: `2px solid ${meridianTokens.color.accent}`,
                animation: `${ringPulse} 2s ease-out infinite`,
                pointerEvents: 'none',
              }}
            />
            <IconButton
              onClick={openChat}
              aria-label="Open agent chat"
              sx={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                color: '#fff',
                bgcolor: meridianTokens.color.accent,
                border: '1px solid rgba(255,255,255,0.15)',
                boxShadow: '0 8px 28px rgba(153,27,27,0.45)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  bgcolor: meridianTokens.brand.dark,
                  transform: 'scale(1.05)',
                  boxShadow: '0 12px 32px rgba(153,27,27,0.55)',
                },
              }}
            >
              <IconifyIcon icon="mdi:message-text-outline" width={26} />
            </IconButton>
          </Box>
        </Box>
      ) : null}
    </AnimatePresence>
  )
}

function StackRow({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>{children}</Box>
  )
}
