import { ReactElement } from 'react';
import { List, Toolbar, Box } from '@mui/material';
import Link from 'next/link';
import navItems from '@/nickelfox/data/nav-items';
import SimpleBar from 'simplebar-react';
import NavItem from './NavItem';
import { drawerCloseWidth, drawerOpenWidth } from '..';

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
          href="/dashboard"
          sx={{ display: 'flex', alignItems: 'center', gap: open ? 1.5 : 0, mt: 2, textDecoration: 'none' }}
        >
          <Box component="img" src="/logo.svg" alt="MERIDIAN" sx={{ width: 40, height: 40 }} />
          {open ? (
            <Box component="span" sx={{ fontWeight: 700, fontSize: 18, color: 'common.white', letterSpacing: 1 }}>
              MERIDIAN
            </Box>
          ) : null}
        </Box>
      </Toolbar>
      <SimpleBar style={{ maxHeight: '100vh' }}>
        <List
          component="nav"
          sx={{
            mt: 20,
            py: 2,
            minHeight: 720,
            justifyContent: 'space-between',
          }}
        >
          {navItems.map(navItem => (
            <NavItem key={navItem.id} navItem={navItem} open={open} />
          ))}
        </List>
      </SimpleBar>
    </>
  );
};

export default Sidebar;
