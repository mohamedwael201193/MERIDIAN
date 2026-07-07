import { ReactElement } from 'react'
import {
  List,
  Box,
  Typography,
  Divider,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material'
import Link from 'next/link'
import { navGroups } from '@/nickelfox/data/nav-items'
import SimpleBar from 'simplebar-react'
import NavItem from './NavItem'

const SIDEBAR_HEADER_HEIGHT = 88

const Sidebar = ({ open }: { open: boolean }): ReactElement => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '100vh' }}>
      <Box
        component="header"
        sx={{
          flexShrink: 0,
          height: SIDEBAR_HEADER_HEIGHT,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: '1px solid',
          borderColor: 'divider',
          px: open ? 1.5 : 1,
          position: 'relative',
          zIndex: 2,
        }}
      >
        <ListItemButton
          component={Link}
          href="/"
          aria-label="MERIDIAN home"
          sx={{
            borderRadius: 2,
            justifyContent: open ? 'flex-start' : 'center',
            gap: open ? 1.5 : 0,
            px: open ? 1.5 : 1,
            py: 1,
            minHeight: 56,
            width: '100%',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' },
          }}
        >
          <ListItemIcon
            sx={{
              minWidth: 0,
              width: 40,
              height: 40,
              mr: open ? 0.5 : 0,
              justifyContent: 'center',
            }}
          >
            <Box component="img" src="/logo.svg" alt="" aria-hidden sx={{ width: 40, height: 40 }} />
          </ListItemIcon>
          {open ? (
            <ListItemText
              primary="MERIDIAN"
              primaryTypographyProps={{
                fontWeight: 700,
                fontSize: 18,
                letterSpacing: 1,
                color: 'common.white',
              }}
            />
          ) : null}
        </ListItemButton>
      </Box>

      <SimpleBar style={{ flex: 1, maxHeight: `calc(100vh - ${SIDEBAR_HEADER_HEIGHT}px)` }}>
        <List
          component="nav"
          aria-label="MERIDIAN dashboard navigation"
          sx={{
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
    </Box>
  )
}

export default Sidebar
