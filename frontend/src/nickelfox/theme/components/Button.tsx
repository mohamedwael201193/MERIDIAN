import { Theme } from '@mui/material'
import { Components } from '@mui/material/styles/components'

const Button: Components<Omit<Theme, 'components'>>['MuiButton'] = {
  defaultProps: {
    variant: 'contained',
    size: 'medium',
    disableElevation: true,
  },
  styleOverrides: {
    root: ({ theme }) => ({
      borderRadius: theme.shape.borderRadius * 1.5,
      textTransform: 'none',
      transition: theme.transitions.create(
        ['transform', 'box-shadow', 'background-color', 'border-color'],
        {
          duration: 160,
          easing: theme.transitions.easing.easeOut,
        },
      ),
      '&:active': {
        transform: 'scale(0.97)',
      },
      '&.Mui-disabled': {
        opacity: 0.5,
      },
    }),
    containedPrimary: ({ theme }) => ({
      boxShadow: `0 8px 24px -8px ${theme.palette.primary.main}66`,
      '&:hover': {
        boxShadow: `0 10px 28px -6px ${theme.palette.primary.main}80`,
        transform: 'translateY(-1px)',
      },
    }),
    containedError: ({ theme }) => ({
      boxShadow: `0 8px 24px -8px ${theme.palette.error.main}66`,
      '&:hover': {
        boxShadow: `0 10px 28px -6px ${theme.palette.error.main}80`,
        transform: 'translateY(-1px)',
      },
    }),
    containedSuccess: () => ({
      '&:hover': {
        transform: 'translateY(-1px)',
      },
    }),
    outlined: () => ({
      '&:hover': {
        transform: 'translateY(-1px)',
      },
    }),
    sizeSmall: ({ theme }) => ({
      padding: theme.spacing(1.25, 2),
      fontSize: theme.typography.body1.fontSize,
      fontWeight: theme.typography.body1.fontWeight,
    }),
    sizeMedium: ({ theme }) => ({
      padding: theme.spacing(2.5, 4),
      fontSize: theme.typography.subtitle1.fontSize,
      fontWeight: theme.typography.subtitle2.fontWeight,
    }),
    sizeLarge: ({ theme }) => ({
      padding: theme.spacing(2.5, 6),
      fontSize: theme.typography.h5.fontSize,
      fontWeight: theme.typography.h5.fontWeight,
    }),
    disabled: ({ theme }) => ({
      backgroundColor: theme.palette.action.disabled,
    }),
  },
}

export default Button
