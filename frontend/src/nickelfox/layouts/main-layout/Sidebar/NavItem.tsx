'use client';

import { ListItem, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import IconifyIcon from '@/nickelfox/components/base/IconifyIcon';
import { NavItem as NavItemProps } from '@/nickelfox/data/nav-items';

const NavItem = ({ navItem, open }: { navItem: NavItemProps; open: boolean }) => {
  const pathname = usePathname() ?? '/';
  const isActive =
    navItem.path === '/dashboard'
      ? pathname === '/dashboard'
      : pathname === navItem.path ||
        (navItem.path !== '/' && pathname.startsWith(navItem.path));

  return (
    <ListItem
      disablePadding
      sx={theme => ({
        display: 'block',
        px: open ? 3 : 4,
        mb: 1,
        borderRight: !open
          ? isActive
            ? `2px solid ${theme.palette.primary.main}`
            : '3px solid transparent'
          : '',
      })}
    >
      <ListItemButton
        component={Link}
        href={navItem.path}
        sx={{
          minHeight: 48,
          borderRadius: 2,
          opacity: navItem.active ? 1 : 0.5,
          bgcolor: isActive ? (open ? 'primary.main' : 'rgba(220,38,38,0.10)') : 'transparent',
          boxShadow: isActive && open ? '0 14px 30px rgba(220, 38, 38, 0.22)' : 'none',
          '&:hover': {
            bgcolor: isActive ? (open ? 'primary.dark' : 'rgba(220,38,38,0.16)') : 'rgba(255,255,255,0.04)',
            transform: 'translateX(2px)',
          },
          transition: 'all 160ms ease',
          '& .MuiTouchRipple-root': {
            color: isActive ? 'primary.main' : 'text.disabled',
          },
        }}
      >
        <ListItemIcon
          sx={{
            width: 20,
            height: 20,
            mr: open ? 1.5 : 0,
            color: isActive ? (open ? 'background.default' : 'primary.main') : 'text.primary',
          }}
        >
          <IconifyIcon icon={navItem.icon} width={1} height={1} />
        </ListItemIcon>
        <ListItemText
          primary={navItem.title}
          sx={{
            display: open ? 'inline-block' : 'none',
            opacity: open ? 1 : 0,
            color: isActive ? 'background.default' : '',
          }}
        />
      </ListItemButton>
    </ListItem>
  );
};

export default NavItem;
