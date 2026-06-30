'use client'

import { useState, ReactElement, PropsWithChildren } from 'react'
import { Box, Drawer, Toolbar } from '@mui/material'
import Topbar from './Topbar/Topbar'
import Sidebar from './Sidebar/Sidebar'
import Footer from './Footer/Footer'

export const drawerOpenWidth = 260
export const drawerCloseWidth = 88

const MainLayout = ({ children }: PropsWithChildren): ReactElement => {
  const [open, setOpen] = useState<boolean>(true)
  const handleDrawerToggle = () => setOpen(!open)

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          minHeight: '100vh',
          bgcolor: 'background.default',
          background:
            'radial-gradient(circle at 18% 0%, rgba(220,38,38,0.08), transparent 32%), radial-gradient(circle at 100% 12%, rgba(127,29,29,0.08), transparent 28%), #050505',
        }}
      >
        <Topbar open={open} handleDrawerToggle={handleDrawerToggle} />
        {/* Mobile Drawer */}
        <Drawer
          variant="temporary"
          open={open}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerOpenWidth },
          }}
        >
          <Sidebar open={open} />
        </Drawer>
        {/* Desktop Drawer */}
        <Drawer
          variant="permanent"
          component="aside"
          open={open}
          sx={{
            display: { xs: 'none', sm: 'block' },
            width: open ? drawerOpenWidth : drawerCloseWidth,
            '& .MuiDrawer-paper': {
              width: open ? drawerOpenWidth : drawerCloseWidth,
            },
          }}
        >
          <Sidebar open={open} />
        </Drawer>
        <Box
          component="main"
          overflow="auto"
          sx={{
            width: 1,
            flexGrow: 1,
            pt: 3,
            pr: { xs: 2.5, sm: 4 },
            pb: 6.25,
            pl: { xs: 2.5, sm: 4 },
          }}
        >
          <Toolbar
            sx={{
              height: 84,
            }}
          />
          {children}
        </Box>
      </Box>
      <Footer open={open} />
    </>
  )
}

export default MainLayout
