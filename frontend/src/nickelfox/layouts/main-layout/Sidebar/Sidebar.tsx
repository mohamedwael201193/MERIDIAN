import { ReactElement } from 'react'
import { List, Toolbar, Box, Typography, Divider } from '@mui/material'
import Link from 'next/link'
import { navGroups } from '@/nickelfox/data/nav-items'
import SimpleBar from 'simplebar-react'
import NavItem from './NavItem'
import { drawerCloseWidth, drawerOpenWidth } from '..'

const Sidebar = ({ open }: { open: boolean }): ReactElement => {
  return (
    <>
      <Toolbar
        sx={{
          position: 'fixed',
          height: 88,
          zIndex: 1,
          bgcolor: 'transparent',
          p: 0,
          justifyContent: 'center',
          width: open ? drawerOpenWidth - 1 : drawerCloseWidth - 1,
          borderRight: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box
          component={Link}
          href="/agent"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: open ? 1.5 : 0,
            mt: 2,
            textDecoration: 'none',
          }}
        >
          <Box component="img" src="/logo.svg" alt="MERIDIAN" sx={{ width: 40, height: 40 }} />
          {open ? (
            <Box
              component="span"
              sx={{ fontWeight: 700, fontSize: 18, color: 'common.white', letterSpacing: 1 }}
            >
              MERIDIAN
            </Box>
          ) : null}
        </Box>
      </Toolbar>
      <SimpleBar style={{ maxHeight: '100vh' }}>
        <List
          component="nav"
          aria-label="MERIDIAN dashboard navigation"
          sx={{
            mt: 20,
            py: 2,
            px: 0,
          }}
        >
          {navGroups.map((group, groupIndex) => (
            <Box key={group.id} component="li" sx={{ listStyle: 'none', mb: 1.5 }}>
              {open ? (
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    px: 3,
                    pt: groupIndex === 0 ? 0 : 1.5,
                    pb: 1,
                    color: 'text.disabled',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    fontWeight: 600,
                  }}
                >
                  {group.label}
                </Typography>
              ) : groupIndex > 0 ? (
                <Divider sx={{ mx: 2, my: 1, borderColor: 'divider' }} />
              ) : null}
              {group.items.map((navItem) => (
                <NavItem key={navItem.id} navItem={navItem} open={open} groupLabel={group.label} />
              ))}
            </Box>
          ))}
        </List>
      </SimpleBar>
    </>
  )
}

export default Sidebar
