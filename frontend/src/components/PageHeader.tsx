'use client'

import { ReactElement, ReactNode } from 'react'
import { Box, Breadcrumbs, Chip, Stack, Typography, Link as MuiLink } from '@mui/material'
import Link from 'next/link'
import IconifyIcon from '@/nickelfox/components/base/IconifyIcon'

export interface PageHeaderProps {
  icon: string
  eyebrow: string
  title: string
  description: string
  /** Where this page sits in the guided MERIDIAN flow, e.g. "Step 3 of 8". */
  stepLabel?: string
  actions?: ReactNode
}

export default function PageHeader({
  icon,
  eyebrow,
  title,
  description,
  stepLabel,
  actions,
}: PageHeaderProps): ReactElement {
  return (
    <Box mb={3.5}>
      <Breadcrumbs
        separator={<IconifyIcon icon="mdi:chevron-right" width={14} height={14} />}
        sx={{ mb: 1.5, '& .MuiBreadcrumbs-li': { display: 'flex', alignItems: 'center' } }}
      >
        <MuiLink
          component={Link}
          href="/dashboard"
          underline="hover"
          color="text.secondary"
          variant="caption"
          sx={{ letterSpacing: '0.06em', textTransform: 'uppercase' }}
        >
          MERIDIAN
        </MuiLink>
        <Typography
          variant="caption"
          color="primary.light"
          sx={{ letterSpacing: '0.06em', textTransform: 'uppercase' }}
        >
          {eyebrow}
        </Typography>
      </Breadcrumbs>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        gap={2}
      >
        <Stack direction="row" gap={2} alignItems="flex-start">
          <Box
            sx={{
              width: 44,
              height: 44,
              flexShrink: 0,
              borderRadius: 2.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'rgba(220,38,38,0.12)',
              border: '1px solid',
              borderColor: 'rgba(220,38,38,0.28)',
            }}
          >
            <IconifyIcon icon={icon} width={22} height={22} color="primary.light" />
          </Box>
          <Box>
            <Stack direction="row" gap={1.5} alignItems="center" flexWrap="wrap">
              <Typography variant="h3" color="common.white">
                {title}
              </Typography>
              {stepLabel ? (
                <Chip size="small" variant="outlined" color="primary" label={stepLabel} />
              ) : null}
            </Stack>
            <Typography variant="body1" color="text.secondary" mt={0.5} maxWidth={640}>
              {description}
            </Typography>
          </Box>
        </Stack>
        {actions ? <Box flexShrink={0}>{actions}</Box> : null}
      </Stack>
    </Box>
  )
}
