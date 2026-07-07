'use client'

import { forwardRef, ReactElement } from 'react'
import { Box, IconButton, Stack, TextField, Typography, CircularProgress } from '@mui/material'
import IconifyIcon from '@/nickelfox/components/base/IconifyIcon'
import { meridianTokens } from '@/design/tokens'
import { panelSurfaceSx } from '@/design/surface'

interface CommandBarProps {
  value: string
  onChange: (v: string) => void
  onSubmit: () => void
  loading?: boolean
  /** Blocks send only — the input stays editable */
  disabled?: boolean
  onBlockedSubmit?: () => void
}

export default forwardRef<HTMLDivElement, CommandBarProps>(function CommandBar(
  {
    value,
    onChange,
    onSubmit,
    loading,
    disabled,
    onBlockedSubmit,
  },
  ref,
): ReactElement {
  const canSubmit = !loading && !disabled && value.trim().length > 0

  const handleSubmit = () => {
    if (loading) return
    if (disabled) {
      onBlockedSubmit?.()
      return
    }
    if (value.trim()) onSubmit()
  }

  return (
    <Box
      ref={ref}
      sx={{
        position: 'sticky',
        bottom: 0,
        zIndex: 30,
        pt: meridianTokens.spacing.sectionGap,
        pb: 2.5,
        mt: 'auto',
        pointerEvents: 'auto',
        background: 'linear-gradient(180deg, transparent 0%, rgba(5,5,5,0.72) 28%, #050505 100%)',
      }}
    >
      <Box maxWidth={720} mx="auto" px={{ xs: 0, sm: 1 }}>
        <Stack alignItems="center" textAlign="center" mb={2.5} spacing={0.75}>
          <Typography
            sx={{
              ...meridianTokens.typography.title,
              fontSize: { xs: '1.15rem', sm: '1.35rem' },
              color: 'common.white',
            }}
          >
            What should I help you with today?
          </Typography>
          <Typography variant="body2" color="text.secondary" maxWidth={480}>
            Ask about yield, compliance, staking, or run an agent mission
          </Typography>
        </Stack>

        <Box
          sx={{
            p: { xs: 1.25, sm: 1.5 },
            borderRadius: `${meridianTokens.radius.lg}px`,
            position: 'relative',
            ...panelSurfaceSx(),
          }}
        >
          <Stack direction="row" alignItems="flex-end" gap={1.25}>
            <Box
              sx={{
                width: 40,
                height: 40,
                flexShrink: 0,
                borderRadius: `${meridianTokens.radius.md}px`,
                bgcolor: meridianTokens.color.accentMuted,
                display: { xs: 'none', sm: 'flex' },
                alignItems: 'center',
                justifyContent: 'center',
                mb: 0.25,
              }}
            >
              <IconifyIcon icon="mdi:robot-outline" width={20} color={meridianTokens.color.accent} />
            </Box>

            <TextField
              fullWidth
              multiline
              minRows={1}
              maxRows={5}
              placeholder={
                disabled
                  ? 'Type your objective — complete setup to send…'
                  : 'Stake 500 CSPR, check yield, run compliance audit…'
              }
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit()
                }
              }}
              disabled={loading}
              autoFocus={false}
              sx={{
                '& .MuiOutlinedInput-root': {
                  alignItems: 'flex-end',
                  borderRadius: `${meridianTokens.radius.lg}px`,
                  bgcolor: '#0a0a0e',
                  border: '1px solid',
                  borderColor: meridianTokens.surface.panelBorder,
                  fontSize: { xs: 15, sm: 17 },
                  lineHeight: 1.5,
                  py: 1.25,
                  px: 0.5,
                  minHeight: 56,
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                  '& fieldset': { border: 'none' },
                  '&:hover': { borderColor: 'rgba(255,255,255,0.22)' },
                  '&.Mui-focused': {
                    borderColor: meridianTokens.color.accent,
                    boxShadow: `0 0 0 3px rgba(153,27,27,0.15)`,
                  },
                },
                '& textarea': {
                  fontFamily: meridianTokens.typography.fontFamily,
                  padding: '10px 14px !important',
                  '&::placeholder': {
                    color: meridianTokens.color.textMuted,
                    opacity: 1,
                  },
                },
                '& .MuiInputBase-input::placeholder': {
                  color: meridianTokens.color.textMuted,
                  opacity: 1,
                },
              }}
            />

            <IconButton
              onClick={handleSubmit}
              disabled={loading || (!disabled && !value.trim())}
              aria-label="Send message"
              sx={{
                flexShrink: 0,
                width: 48,
                height: 48,
                mb: 0.25,
                borderRadius: `${meridianTokens.radius.md}px`,
                bgcolor: canSubmit || (disabled && value.trim())
                  ? 'primary.main'
                  : 'rgba(255,255,255,0.06)',
                color: canSubmit || (disabled && value.trim()) ? '#fff' : meridianTokens.color.textMuted,
                boxShadow: canSubmit || (disabled && value.trim()) ? '0 4px 16px rgba(153,27,27,0.35)' : 'none',
                transition: 'background-color 0.2s, box-shadow 0.2s, transform 0.15s',
                '&:hover': {
                  bgcolor: canSubmit ? 'primary.dark' : 'rgba(255,255,255,0.08)',
                  transform: canSubmit ? 'translateY(-1px)' : 'none',
                },
                '&.Mui-disabled': {
                  bgcolor: 'rgba(255,255,255,0.04)',
                  color: meridianTokens.color.textMuted,
                },
              }}
            >
              {loading ? (
                <CircularProgress size={22} color="inherit" />
              ) : (
                <IconifyIcon icon="mdi:arrow-up" width={22} />
              )}
            </IconButton>
          </Stack>
          {disabled ? (
            <Typography variant="caption" color="warning.light" display="block" mt={1.25} textAlign="center">
              Complete setup to send messages — you can still type and draft objectives here.
            </Typography>
          ) : null}
        </Box>

        <Stack
          direction="row"
          alignItems="center"
          justifyContent="center"
          gap={2}
          flexWrap="wrap"
          mt={1.5}
        >
          <Stack direction="row" alignItems="center" gap={0.75}>
            <IconifyIcon icon="mdi:shield-check-outline" width={14} color={meridianTokens.color.textMuted} />
            <Typography variant="caption" color="text.secondary">
              MERIDIAN never signs without your approval
            </Typography>
          </Stack>
          <Typography
            variant="caption"
            color="text.disabled"
            sx={{ fontFamily: meridianTokens.typography.mono.fontFamily, fontSize: 11 }}
          >
            Enter to send · Shift+Enter for new line
          </Typography>
        </Stack>
      </Box>
    </Box>
  )
})
