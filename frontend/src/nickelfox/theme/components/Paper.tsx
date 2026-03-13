import { Theme } from '@mui/material';
import { Components } from '@mui/material/styles/components';

const Paper: Components<Omit<Theme, 'components'>>['MuiPaper'] = {
  defaultProps: {},
  styleOverrides: {
    root: ({ theme }) => ({
      display: 'flex',
      flexDirection: 'column',
      background:
        'linear-gradient(145deg, rgba(18,18,24,0.96), rgba(9,9,12,0.98))',
      border: `1px solid ${theme.palette.divider}`,
      borderRadius: theme.shape.borderRadius * 2.5,
      boxShadow: '0 18px 60px rgba(0, 0, 0, 0.28)',
      backdropFilter: 'blur(18px)',
    }),
  },
};

export default Paper;
