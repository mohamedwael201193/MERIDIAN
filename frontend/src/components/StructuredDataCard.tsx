'use client'

import { ReactElement } from 'react'
import { Box, Chip, Divider, Paper, Stack, Typography, Link as MuiLink } from '@mui/material'
import { explorerContractUrl, explorerTxUrl, truncateHash } from '@lib/contracts'

interface StructuredDataCardProps {
  title: string
  subtitle?: string
  data: unknown
  emptyText?: string
}

function labelize(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function isHashLike(value: string): boolean {
  return value.length > 24 && /^[a-zA-Z0-9-]+$/.test(value)
}

function linkForValue(key: string, value: string): string | null {
  const normalizedKey = key.toLowerCase()
  if (normalizedKey.includes('transaction') || normalizedKey.includes('tx')) {
    return explorerTxUrl(value)
  }
  if (normalizedKey.includes('contract') || normalizedKey.includes('package')) {
    return explorerContractUrl(value)
  }
  if (value.startsWith('https://')) {
    return value
  }
  return null
}

function renderPrimitive(key: string, value: string | number | boolean | null): ReactElement {
  if (value === null) {
    return <Typography color="text.disabled">Not available</Typography>
  }

  if (typeof value === 'boolean') {
    return <Chip size="small" color={value ? 'success' : 'warning'} label={value ? 'Yes' : 'No'} />
  }

  const text = String(value)
  const href = typeof value === 'string' ? linkForValue(key, value) : null

  if (href) {
    return (
      <MuiLink href={href} target="_blank" rel="noreferrer" variant="body2">
        {isHashLike(text) ? truncateHash(text) : text}
      </MuiLink>
    )
  }

  return (
    <Typography color="common.white" sx={{ wordBreak: 'break-word' }}>
      {isHashLike(text) ? truncateHash(text) : text}
    </Typography>
  )
}

function renderRows(data: unknown, parentKey = 'value'): ReactElement {
  if (data === null || typeof data !== 'object') {
    return renderPrimitive(parentKey, data as string | number | boolean | null)
  }

  if (Array.isArray(data)) {
    if (data.length === 0) {
      return <Typography color="text.secondary">No entries returned.</Typography>
    }

    return (
      <Stack gap={1.5}>
        {data.slice(0, 12).map((item, index) => (
          <Paper
            key={`${parentKey}-${index}`}
            variant="outlined"
            sx={{ p: 1.5, bgcolor: 'background.default' }}
          >
            <Typography variant="caption" color="text.secondary">
              Entry {index + 1}
            </Typography>
            <Box mt={1}>{renderRows(item, `${parentKey}-${index}`)}</Box>
          </Paper>
        ))}
        {data.length > 12 ? (
          <Typography variant="caption" color="text.secondary">
            Showing 12 of {data.length} entries.
          </Typography>
        ) : null}
      </Stack>
    )
  }

  const entries = Object.entries(data as Record<string, unknown>).filter(
    ([, value]) => value !== undefined,
  )

  if (entries.length === 0) {
    return <Typography color="text.secondary">No fields returned.</Typography>
  }

  return (
    <Stack divider={<Divider flexItem />} spacing={1}>
      {entries.map(([key, value]) => (
        <Box key={`${parentKey}-${key}`} py={0.75}>
          <Typography variant="caption" color="text.secondary">
            {labelize(key)}
          </Typography>
          <Box mt={0.5}>{renderRows(value, key)}</Box>
        </Box>
      ))}
    </Stack>
  )
}

export default function StructuredDataCard({
  title,
  subtitle,
  data,
  emptyText = 'No data returned yet.',
}: StructuredDataCardProps): ReactElement {
  if (!data) {
    return (
      <Paper
        variant="outlined"
        sx={{ p: 2.5, bgcolor: 'background.default', borderColor: 'divider' }}
      >
        <Typography variant="h6" color="common.white">
          {title}
        </Typography>
        <Typography color="text.secondary" mt={1}>
          {emptyText}
        </Typography>
      </Paper>
    )
  }

  return (
    <Paper
      variant="outlined"
      sx={{ p: 2.5, bgcolor: 'background.default', borderColor: 'divider' }}
    >
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={1} mb={2}>
        <Box>
          <Typography variant="h6" color="common.white">
            {title}
          </Typography>
          {subtitle ? (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          ) : null}
        </Box>
      </Stack>
      {renderRows(data)}
    </Paper>
  )
}
