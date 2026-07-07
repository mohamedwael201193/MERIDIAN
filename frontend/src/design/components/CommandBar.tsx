'use client'

import { ReactElement } from 'react'
import { Box, IconButton, InputAdornment, TextField, Typography, CircularProgress } from '@mui/material'
import IconifyIcon from '@/nickelfox/components/base/IconifyIcon'
import { meridianTokens } from '@/design/tokens'

interface CommandBarProps {
  value: string
  onChange: (v: string) => void
  onSubmit: () => void
  loading?: boolean
  disabled?: boolean
}

export default function CommandBar({
  value,
  onChange,
  onSubmit,
  loading,
  disabled,
}: CommandBarProps): ReactElement {
  return (
    <Box
      sx={{
        position: 'sticky',
        bottom: 0,
        pt: 2,
        pb: 1,
        bgcolor: 'linear-gradient(transparent, #050505 24%)',
      }}
    >
      <Typography variant="body1" color="common.white" fontWeight={600} mb={1.5} textAlign="center">
        What should I help you with today?
      </Typography>
      <TextField
        fullWidth
        multiline
        maxRows={4}
        placeholder="Stake 500 CSPR, check yield, run compliance audit…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            onSubmit()
          }
        }}
        disabled={disabled || loading}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: `${meridianTokens.radius.xl}px`,
            bgcolor: meridianTokens.color.glass,
            border: '1px solid',
            borderColor: meridianTokens.color.glassBorder,
            fontSize: 16,
            py: 0.75,
            boxShadow: meridianTokens.shadow.card,
            '&:hover': { borderColor: 'rgba(220,38,38,0.3)' },
            '&.Mui-focused': { borderColor: meridianTokens.color.accent },
          },
        }}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                color="primary"
                onClick={onSubmit}
                disabled={loading || disabled || !value.trim()}
                sx={{
                  bgcolor: 'primary.main',
                  color: '#fff',
                  width: 40,
                  height: 40,
                  '&:hover': { bgcolor: 'primary.dark' },
                  '&.Mui-disabled': { bgcolor: 'action.disabledBackground' },
                }}
              >
                {loading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <IconifyIcon icon="mdi:arrow-up" width={20} />
                )}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
      <Typography variant="caption" color="text.disabled" textAlign="center" display="block" mt={1}>
        MERIDIAN never signs without your approval
      </Typography>
    </Box>
  )
}
