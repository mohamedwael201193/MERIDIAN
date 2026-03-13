'use client'

import { Stack, AppBar, Toolbar, IconButton, Box, Typography } from '@mui/material'
import IconifyIcon from '@/nickelfox/components/base/IconifyIcon'
import { ReactElement } from 'react'
import { drawerCloseWidth, drawerOpenWidth } from '..'
import WalletAccountStatus from '@/components/WalletAccountStatus'
import { useBreakpoints } from '@/nickelfox/providers/BreakpointsProvider'
import { useCommandPalette } from '@/design/components/CommandPalette'
import { meridianTokens } from '@/design/tokens'
import { panelSurfaceSx } from '@/design/surface'

const Topbar = ({
  open,
  handleDrawerToggle,
}: {
  open: boolean
  handleDrawerToggle: () => void
}): ReactElement => {
  const { down } = useBreakpoints()
  const { setOpen } = useCommandPalette()
  const isMobileScreen = down('sm')

  return (
    <AppBar
      position="fixed"
      sx={{
        left: 0,
        ml: isMobileScreen ? 0 : open ? 60 : 27.5,
        width: isMobileScreen
          ? 1
          : open
            ? `calc(100% - ${drawerOpenWidth}px)`
            : `calc(100% - ${drawerCloseWidth}px)`,
        paddingRight: '0 !important',
      }}
    >
      <Toolbar
        disableGutters
        sx={{
          bgcolor: 'transparent',
          minHeight: { xs: 72, sm: 80 },
          px: { xs: 2, sm: 3 },
          py: 1.5,
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" width="100%" gap={2}>
          <IconButton
            color="inherit"
            aria-label={open ? 'Collapse navigation' : 'Expand navigation'}
            onClick={handleDrawerToggle}
            sx={{
              borderRadius: `${meridianTokens.radius.md}px`,
              width: 40,
              height: 40,
              ...panelSurfaceSx({ nested: true, spark: false }),
              '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' },
            }}
          >
            <IconifyIcon
              icon={open ? 'ri:menu-unfold-4-line' : 'ri:menu-unfold-3-line'}
              color="common.white"
            />
          </IconButton>

          <Stack direction="row" alignItems="center" gap={1.25} flexShrink={0}>
            <Box
              component="button"
              type="button"
              onClick={() => setOpen(true)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                borderRadius: `${meridianTokens.radius.lg}px`,
                color: meridianTokens.color.textSecondary,
                cursor: 'pointer',
                py: 0.875,
                pl: 1.5,
                pr: 1.25,
                transition: 'border-color 0.2s, background-color 0.2s',
                ...panelSurfaceSx({ nested: true }),
                '&:hover': {
                  borderColor: meridianTokens.surface.panelHoverBorder,
                },
              }}
            >
              <IconifyIcon icon="mdi:magnify" width={16} color={meridianTokens.color.textMuted} />
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ display: { xs: 'none', md: 'block' }, fontWeight: 500 }}
              >
                Search
              </Typography>
              <Box
                component="kbd"
                sx={{
                  display: { xs: 'none', lg: 'inline-flex' },
                  alignItems: 'center',
                  px: 0.75,
                  py: 0.25,
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: meridianTokens.color.glassBorder,
                  bgcolor: 'rgba(255,255,255,0.04)',
                  fontFamily: meridianTokens.typography.mono.fontFamily,
                  fontSize: 10,
                  color: meridianTokens.color.textMuted,
                  lineHeight: 1.4,
                }}
              >
                ⌘K
              </Box>
            </Box>

            <WalletAccountStatus />
          </Stack>
        </Stack>
      </Toolbar>
    </AppBar>
  )
}

export default Topbar
