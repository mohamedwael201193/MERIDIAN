import { Theme } from '@mui/material'
import { Components } from '@mui/material/styles/components'

const Drawer: Components<Omit<Theme, 'components'>>['MuiDrawer'] = {
  defaultProps: {},
  styleOverrides: {
    paper: ({ theme }) => ({
      borderRadius: 0,
      background: 'linear-gradient(180deg, rgba(5,5,5,0.98), rgba(9,9,12,0.96))',
      borderRight: `1px solid ${theme.palette.divider}`,
      boxShadow: '16px 0 48px rgba(0, 0, 0, 0.28)',
    }),
  },
}

export default Drawer
