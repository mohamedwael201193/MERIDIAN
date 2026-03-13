import { Theme } from '@mui/material';
import { Components } from '@mui/material/styles/components';

const AppBar: Components<Omit<Theme, 'components'>>['MuiAppBar'] = {
  defaultProps: {},
  styleOverrides: {
    root: ({ theme }) => ({
      boxShadow: '0 14px 40px rgba(0, 0, 0, 0.22)',
      backgroundColor: 'rgba(5, 5, 5, 0.82)',
      borderBottom: `1px solid ${theme.palette.divider}`,
      backdropFilter: 'blur(18px)',
    }),
  },
};

export default AppBar;
