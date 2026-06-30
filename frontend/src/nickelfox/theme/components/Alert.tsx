import { Theme, alpha } from '@mui/material'
import { Components } from '@mui/material/styles/components'

const Alert: Components<Omit<Theme, 'components'>>['MuiAlert'] = {
  defaultProps: {
    variant: 'outlined',
  },
  styleOverrides: {
    root: ({ theme }) => ({
      borderRadius: theme.shape.borderRadius * 1.5,
      fontSize: 13.5,
      alignItems: 'flex-start',
    }),
    standardError: ({ theme }) => ({
      backgroundColor: alpha(theme.palette.error.main, 0.12),
      color: '#fecaca',
      borderColor: alpha(theme.palette.error.main, 0.4),
      '& .MuiAlert-icon': { color: theme.palette.error.light },
    }),
    standardSuccess: ({ theme }) => ({
      backgroundColor: alpha(theme.palette.success.main, 0.12),
      color: '#bbf7d0',
      borderColor: alpha(theme.palette.success.main, 0.4),
      '& .MuiAlert-icon': { color: theme.palette.success.light },
    }),
    standardWarning: ({ theme }) => ({
      backgroundColor: alpha(theme.palette.warning.main, 0.12),
      color: '#fde68a',
      borderColor: alpha(theme.palette.warning.main, 0.4),
      '& .MuiAlert-icon': { color: theme.palette.warning.light },
    }),
    standardInfo: ({ theme }) => ({
      backgroundColor: alpha(theme.palette.info.main, 0.16),
      color: '#e2e8f0',
      borderColor: alpha(theme.palette.info.main, 0.4),
      '& .MuiAlert-icon': { color: theme.palette.info.light },
    }),
    outlinedError: ({ theme }) => ({
      backgroundColor: alpha(theme.palette.error.main, 0.1),
      color: '#fecaca',
      borderColor: alpha(theme.palette.error.main, 0.45),
      '& .MuiAlert-icon': { color: theme.palette.error.light },
    }),
    outlinedSuccess: ({ theme }) => ({
      backgroundColor: alpha(theme.palette.success.main, 0.1),
      color: '#bbf7d0',
      borderColor: alpha(theme.palette.success.main, 0.45),
      '& .MuiAlert-icon': { color: theme.palette.success.light },
    }),
    outlinedWarning: ({ theme }) => ({
      backgroundColor: alpha(theme.palette.warning.main, 0.1),
      color: '#fde68a',
      borderColor: alpha(theme.palette.warning.main, 0.45),
      '& .MuiAlert-icon': { color: theme.palette.warning.light },
    }),
    outlinedInfo: ({ theme }) => ({
      backgroundColor: alpha(theme.palette.info.main, 0.14),
      color: '#e2e8f0',
      borderColor: alpha(theme.palette.info.main, 0.45),
      '& .MuiAlert-icon': { color: theme.palette.info.light },
    }),
    message: () => ({
      overflow: 'visible',
    }),
  },
}

export default Alert
