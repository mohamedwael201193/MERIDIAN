'use client'

import { Stack, AppBar, Toolbar, IconButton, Chip } from '@mui/material'
import IconifyIcon from '@/nickelfox/components/base/IconifyIcon'
import { ReactElement } from 'react'
import { drawerCloseWidth, drawerOpenWidth } from '..'
import WalletAccountStatus from '@/components/WalletAccountStatus'
import { useBreakpoints } from '@/nickelfox/providers/BreakpointsProvider'
import { useReady } from '@lib/hooks/useMeridianData'

const Topbar = ({
  open,
  handleDrawerToggle,
}: {
  open: boolean
  handleDrawerToggle: () => void
}): ReactElement => {
  const { down } = useBreakpoints()
  const { data } = useReady()
  const isMobileScreen = down('sm')
  const backendStatus = typeof data?.status === 'string' ? data.status : 'checking'

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
        component={Stack}
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{
          bgcolor: 'transparent',
          height: 92,
        }}
      >
        <Stack direction="row" gap={1.5} alignItems="center" ml={2.5} flex="1 1 auto">
          <IconButton
            color="inherit"
            aria-label={open ? 'Collapse navigation' : 'Expand navigation'}
            onClick={handleDrawerToggle}
            edge="start"
          >
            <IconifyIcon
              icon={open ? 'ri:menu-unfold-4-line' : 'ri:menu-unfold-3-line'}
              color="common.white"
            />
          </IconButton>
          <Chip
            size="small"
            variant="outlined"
            color={
              backendStatus === 'ok'
                ? 'success'
                : backendStatus === 'degraded'
                  ? 'warning'
                  : 'default'
            }
            label={`Backend ${backendStatus}`}
            sx={{ display: { xs: 'none', md: 'inline-flex' } }}
          />
        </Stack>
        <Stack direction="row" gap={1.5} alignItems="center" justifyContent="flex-end" mr={3}>
          <WalletAccountStatus />
        </Stack>
      </Toolbar>
    </AppBar>
  )
}

export default Topbar
