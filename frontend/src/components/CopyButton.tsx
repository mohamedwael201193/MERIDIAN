'use client'

import { useState, ReactElement } from 'react'
import { Button, IconButton, Tooltip } from '@mui/material'
import IconifyIcon from '@/nickelfox/components/base/IconifyIcon'

interface CopyButtonProps {
  text: string
  label?: string
  size?: 'small' | 'medium'
  variant?: 'button' | 'icon'
}

export default function CopyButton({
  text,
  label = 'Copy',
  size = 'small',
  variant = 'button',
}: CopyButtonProps): ReactElement {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  if (variant === 'icon') {
    return (
      <Tooltip title={copied ? 'Copied!' : label}>
        <IconButton size={size} onClick={() => void copy()} aria-label={label}>
          <IconifyIcon icon={copied ? 'mdi:check' : 'mdi:content-copy'} width={18} />
        </IconButton>
      </Tooltip>
    )
  }

  return (
    <Button
      size={size}
      variant="outlined"
      onClick={() => void copy()}
      startIcon={<IconifyIcon icon={copied ? 'mdi:check' : 'mdi:content-copy'} width={16} />}
    >
      {copied ? 'Copied' : label}
    </Button>
  )
}
