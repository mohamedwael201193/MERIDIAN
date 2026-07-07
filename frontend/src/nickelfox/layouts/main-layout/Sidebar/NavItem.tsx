'use client'

import { ListItem, ListItemButton, ListItemIcon, ListItemText, Tooltip } from '@mui/material'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import IconifyIcon from '@/nickelfox/components/base/IconifyIcon'
import { NavItem as NavItemProps } from '@/nickelfox/data/nav-items'
import { meridianTokens } from '@/design/tokens'

const NavItem = ({
  navItem,
  open,
  groupLabel,
}: {
  navItem: NavItemProps
  open: boolean
  groupLabel: string
}) => {
  const pathname = usePathname() ?? '/'
  const isActive =
    navItem.path === '/dashboard'
      ? pathname === '/dashboard'
      : pathname === navItem.path ||
        (navItem.path !== '/' && pathname.startsWith(`${navItem.path}/`))

  const tooltipTitle = open ? '' : `${groupLabel} · ${navItem.title}`

  const button = (
    <ListItemButton
      component={Link}
      href={navItem.path}
      aria-current={isActive ? 'page' : undefined}
      sx={{
        minHeight: 44,
        mx: open ? 2 : 1.5,
        px: open ? 2 : 1.25,
        borderRadius: 2,
        justifyContent: open ? 'flex-start' : 'center',
        bgcolor: isActive ? (open ? 'primary.dark' : `rgba(${meridianTokens.brand.rgb}, 0.12)`) : 'transparent',
        boxShadow: isActive && open ? '0 12px 28px rgba(153, 27, 27, 0.22)' : 'none',
        borderLeft: !open && isActive ? '2px solid' : '2px solid transparent',
        borderColor: !open && isActive ? 'primary.dark' : 'transparent',
        '&:hover': {
          bgcolor: isActive
            ? open
              ? meridianTokens.brand.main
              : `rgba(${meridianTokens.brand.rgb}, 0.18)`
            : 'rgba(255,255,255,0.05)',
        },
        transition: 'background-color 160ms ease, box-shadow 160ms ease',
      }}
    >
      <ListItemIcon
        sx={{
          minWidth: open ? 36 : 0,
          width: 22,
          height: 22,
          mr: open ? 1.25 : 0,
          justifyContent: 'center',
          color: isActive ? (open ? 'background.default' : 'primary.dark') : 'text.secondary',
        }}
      >
        <IconifyIcon icon={navItem.icon} width={22} height={22} />
      </ListItemIcon>
      {open ? (
        <ListItemText
          primary={navItem.title}
          primaryTypographyProps={{
            fontSize: 14,
            fontWeight: isActive ? 600 : 500,
            color: isActive ? 'background.default' : 'text.primary',
          }}
        />
      ) : null}
    </ListItemButton>
  )

  return (
    <ListItem disablePadding sx={{ display: 'block', mb: 0.5 }}>
      {open ? (
        button
      ) : (
        <Tooltip title={tooltipTitle} placement="right" arrow describeChild>
          {button}
        </Tooltip>
      )}
    </ListItem>
  )
}

export default NavItem
