'use client'

import { ReactElement } from 'react'
import { Box, Button, Stack, Typography } from '@mui/material'
import { motion, useReducedMotion } from 'motion/react'
import TransactionReviewCard from '@/components/TransactionReviewCard'
import type { UnsignedTransaction } from '@lib/types'
import IconifyIcon from '@/nickelfox/components/base/IconifyIcon'
import { meridianTokens } from '@/design/tokens'
import { panelSurfaceSx } from '@/design/surface'

interface ApprovalPromptProps {
  transaction: UnsignedTransaction
  loading: boolean
  onApprove: () => void
}

export default function ApprovalPrompt({
  transaction,
  loading,
  onApprove,
}: ApprovalPromptProps): ReactElement {
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: meridianTokens.motion.ease }}
    >
      <TransactionReviewCard
        variant="approval"
        transaction={transaction}
        loading={loading}
        txHash={null}
        onSignAndSubmit={onApprove}
      />
    </motion.div>
  )
}

interface SuccessBannerProps {
  title?: string
  subtitle?: string
  explorerHref?: string
}

export function SuccessBanner({
  title = 'Finality verified',
  subtitle,
  explorerHref,
}: SuccessBannerProps): ReactElement {
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: meridianTokens.motion.ease }}
    >
      <Box
        sx={{
          ...panelSurfaceSx({ spark: false }),
          borderRadius: `${meridianTokens.radius.lg}px`,
          px: 2.5,
          py: 2,
          borderColor: 'rgba(34, 197, 94, 0.28)',
          bgcolor: 'rgba(34, 197, 94, 0.06)',
        }}
      >
        <Stack direction="row" spacing={1.25} alignItems="center" mb={subtitle ? 1 : 0}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: `${meridianTokens.radius.sm}px`,
              bgcolor: 'rgba(34, 197, 94, 0.14)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <IconifyIcon icon="mdi:check-circle-outline" width={18} color={meridianTokens.color.success} />
          </Box>
          <Typography
            sx={{
              fontSize: '0.9375rem',
              fontWeight: 600,
              color: meridianTokens.color.success,
            }}
          >
            {title}
          </Typography>
        </Stack>
        {subtitle ? (
          <Typography
            sx={{
              fontSize: '0.8125rem',
              lineHeight: 1.45,
              color: meridianTokens.color.textSecondary,
              mb: explorerHref ? 1.5 : 0,
              pl: 0.25,
            }}
          >
            {subtitle}
          </Typography>
        ) : null}
        {explorerHref ? (
          <Button
            href={explorerHref}
            target="_blank"
            rel="noreferrer"
            variant="outlined"
            size="small"
            startIcon={<IconifyIcon icon="mdi:open-in-new" width={14} />}
            sx={{
              textTransform: 'none',
              fontSize: '0.8125rem',
              fontWeight: 600,
              borderRadius: `${meridianTokens.radius.sm}px`,
              borderColor: 'rgba(34, 197, 94, 0.35)',
              color: meridianTokens.color.success,
              '&:hover': {
                borderColor: meridianTokens.color.success,
                bgcolor: 'rgba(34, 197, 94, 0.08)',
              },
            }}
          >
            View on explorer
          </Button>
        ) : null}
      </Box>
    </motion.div>
  )
}
