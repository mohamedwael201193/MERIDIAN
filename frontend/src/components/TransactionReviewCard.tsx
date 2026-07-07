'use client'

import { ReactElement } from 'react'
import { Box, Button, Chip, Stack, Typography } from '@mui/material'
import type { UnsignedTransaction } from '@lib/types'
import { explorerTxUrl } from '@lib/contracts'
import IconifyIcon from '@/nickelfox/components/base/IconifyIcon'
import GlassCard from '@/design/components/GlassCard'
import { meridianTokens } from '@/design/tokens'

interface TransactionReviewCardProps {
  transaction: UnsignedTransaction
  title?: string
  description?: string
  loading?: boolean
  txHash?: string | null
  onSignAndSubmit: () => void | Promise<void>
  /** Agent briefing: integrated headline without duplicate outer shell */
  variant?: 'standalone' | 'approval'
}

function transactionSize(transaction: unknown): string {
  try {
    const bytes = new Blob([JSON.stringify(transaction)]).size
    if (bytes < 1024) return `${bytes} B`
    return `${(bytes / 1024).toFixed(1)} KB`
  } catch {
    return 'Unknown'
  }
}

function MetaChip({ label, value }: { label: string; value: string }) {
  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.75,
        px: 1.25,
        py: 0.5,
        borderRadius: `${meridianTokens.radius.sm}px`,
        border: '1px solid',
        borderColor: meridianTokens.color.panelBorder,
        bgcolor: meridianTokens.color.panelNested,
      }}
    >
      <Typography
        component="span"
        sx={{
          fontFamily: meridianTokens.typography.fontFamilyMono,
          fontSize: '0.65rem',
          fontWeight: 500,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: meridianTokens.color.textMuted,
        }}
      >
        {label}
      </Typography>
      <Typography
        component="span"
        sx={{
          fontFamily: meridianTokens.typography.fontFamilyMono,
          fontSize: '0.75rem',
          fontWeight: 500,
          color: meridianTokens.color.textPrimary,
        }}
      >
        {value}
      </Typography>
    </Box>
  )
}

export default function TransactionReviewCard({
  transaction,
  title = 'Transaction Ready',
  description = 'Review this unsigned TransactionV1, then approve it in your wallet.',
  loading = false,
  txHash = null,
  onSignAndSubmit,
  variant = 'standalone',
}: TransactionReviewCardProps): ReactElement {
  const isApproval = variant === 'approval'
  const headline = isApproval ? 'Approve in Casper Wallet' : title
  const subtext = isApproval
    ? 'Review the deploy below. Nothing broadcasts until you sign.'
    : description
  const payloadLabel = transactionSize(transaction.transaction)

  return (
    <GlassCard spark={false} elevated padding={2.75}>
      <Stack spacing={2}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          justifyContent="space-between"
          spacing={1.5}
        >
          <Stack direction="row" alignItems="center" spacing={1.25} flex={1} minWidth={0}>
            <Box
              sx={{
                width: 36,
                height: 36,
                flexShrink: 0,
                borderRadius: `${meridianTokens.radius.sm}px`,
                bgcolor: meridianTokens.color.accentMuted,
                border: '1px solid',
                borderColor: 'rgba(153, 27, 27, 0.28)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconifyIcon icon="mdi:wallet-outline" width={18} color={meridianTokens.color.accent} />
            </Box>
            <Stack spacing={0.35} minWidth={0}>
              <Typography
                sx={{
                  fontFamily: meridianTokens.typography.fontFamily,
                  fontSize: isApproval ? '1.05rem' : '1rem',
                  fontWeight: 600,
                  letterSpacing: '-0.02em',
                  color: meridianTokens.color.textPrimary,
                  lineHeight: 1.25,
                }}
              >
                {headline}
              </Typography>
              <Typography
                sx={{
                  fontSize: '0.8125rem',
                  lineHeight: 1.45,
                  color: meridianTokens.color.textSecondary,
                }}
              >
                {subtext}
              </Typography>
            </Stack>
          </Stack>

          <Chip
            size="small"
            label="Signature required"
            icon={<IconifyIcon icon="mdi:draw-pen" width={14} />}
            sx={{
              height: 26,
              flexShrink: 0,
              fontFamily: meridianTokens.typography.fontFamilyMono,
              fontSize: '0.68rem',
              fontWeight: 600,
              letterSpacing: '0.04em',
              bgcolor: meridianTokens.color.accentMuted,
              color: meridianTokens.color.accent,
              border: '1px solid rgba(153, 27, 27, 0.35)',
              '& .MuiChip-icon': { color: 'inherit', ml: 0.75 },
              '& .MuiChip-label': { px: 1 },
            }}
          />
        </Stack>

        {transaction.note ? (
          <Box
            sx={{
              px: 1.75,
              py: 1.25,
              borderRadius: `${meridianTokens.radius.sm}px`,
              border: '1px solid',
              borderColor: 'rgba(245, 158, 11, 0.22)',
              bgcolor: 'rgba(245, 158, 11, 0.06)',
            }}
          >
            <Stack direction="row" spacing={1} alignItems="flex-start">
              <IconifyIcon
                icon="mdi:information-outline"
                width={16}
                color={meridianTokens.color.warning}
                style={{ marginTop: 2, flexShrink: 0 }}
              />
              <Typography
                sx={{
                  fontSize: '0.8125rem',
                  lineHeight: 1.5,
                  color: meridianTokens.color.textSecondary,
                }}
              >
                {transaction.note}
              </Typography>
            </Stack>
          </Box>
        ) : null}

        {transaction.expectedResult ? (
          <Box
            sx={{
              px: 1.75,
              py: 1.25,
              borderRadius: `${meridianTokens.radius.sm}px`,
              border: '1px solid',
              borderColor: meridianTokens.color.panelBorder,
              bgcolor: meridianTokens.color.panelNested,
            }}
          >
            <Typography
              sx={{
                fontSize: '0.68rem',
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: meridianTokens.color.textMuted,
                mb: 0.5,
              }}
            >
              Expected result
            </Typography>
            <Typography
              sx={{
                fontSize: '0.8125rem',
                lineHeight: 1.5,
                color: meridianTokens.color.textSecondary,
              }}
            >
              {transaction.expectedResult}
            </Typography>
          </Box>
        ) : null}

        <Stack direction="row" flexWrap="wrap" gap={1}>
          <MetaChip label="Tool" value={transaction.transactionType || 'TransactionV1'} />
          <MetaChip label="Network" value={transaction.network} />
          <MetaChip label="Chain" value={transaction.chainName} />
          <MetaChip label="Payload" value={payloadLabel} />
          {transaction.requiredRole ? (
            <MetaChip label="Role" value={transaction.requiredRole} />
          ) : null}
          {transaction.attachedValueMotes ? (
            <MetaChip label="Attach" value={`${transaction.attachedValueMotes} motes`} />
          ) : null}
        </Stack>

        {txHash ? (
          <Typography
            sx={{
              fontFamily: meridianTokens.typography.fontFamilyMono,
              fontSize: '0.75rem',
              color: meridianTokens.color.textMuted,
              wordBreak: 'break-all',
            }}
          >
            Explorer: {explorerTxUrl(txHash)}
          </Typography>
        ) : (
          <Typography sx={{ fontSize: '0.75rem', color: meridianTokens.color.textMuted }}>
            Hash and explorer link appear after wallet signature and RPC broadcast.
          </Typography>
        )}

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          justifyContent="space-between"
          spacing={1.5}
          sx={{
            pt: 0.5,
            borderTop: '1px solid',
            borderColor: meridianTokens.color.panelBorder,
          }}
        >
          <Button
            size="small"
            variant="contained"
            disabled={loading}
            onClick={() => void onSignAndSubmit()}
            startIcon={<IconifyIcon icon="mdi:wallet-outline" width={16} />}
            sx={{
              alignSelf: { xs: 'stretch', sm: 'flex-start' },
              minHeight: 36,
              px: 2.25,
              py: 0.75,
              fontSize: '0.8125rem',
              fontWeight: 600,
              letterSpacing: '-0.01em',
              textTransform: 'none',
              borderRadius: `${meridianTokens.radius.sm}px`,
              bgcolor: meridianTokens.color.accent,
              boxShadow: 'none',
              whiteSpace: 'nowrap',
              '&:hover': {
                bgcolor: meridianTokens.brand.dark,
                boxShadow: 'none',
              },
              '&:active': {
                transform: 'scale(0.98)',
              },
              '&.Mui-disabled': {
                bgcolor: 'rgba(153, 27, 27, 0.35)',
                color: 'rgba(255,255,255,0.55)',
              },
            }}
          >
            {loading ? 'Opening wallet...' : 'Sign in wallet'}
          </Button>
          <Typography
            sx={{
              fontSize: '0.75rem',
              lineHeight: 1.45,
              color: meridianTokens.color.textMuted,
              maxWidth: { sm: 280 },
            }}
          >
            Private keys stay in Casper Wallet. MERIDIAN only receives the signed hash.
          </Typography>
        </Stack>
      </Stack>
    </GlassCard>
  )
}
