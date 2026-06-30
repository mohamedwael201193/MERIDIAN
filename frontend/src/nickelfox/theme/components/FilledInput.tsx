import { Theme } from '@mui/material'
import { Components } from '@mui/material/styles/components'

const FilledInput: Components<Omit<Theme, 'components'>>['MuiFilledInput'] = {
  defaultProps: {
    autoComplete: 'off',
  },
  styleOverrides: {
    root: ({ theme }) => ({
      borderRadius: theme.shape.borderRadius * 2,
      backgroundColor: 'rgba(17, 17, 24, 0.88)',
      border: `1px solid ${theme.palette.divider}`,
      padding: 0,
      '&:hover, &.Mui-focused': {
        backgroundColor: 'rgba(24, 24, 32, 0.96)',
        borderColor: theme.palette.primary.dark,
      },
      '&::before, &::after': {
        borderBottom: 'none',
      },
      '&:hover:not(.Mui-disabled, .Mui-error):before': {
        borderBottom: 'none',
      },
      '&.Mui-disabled:before': {
        borderBottom: 'none',
      },
      '&:hover, &.Mui-disabled': {
        backgroundColor: 'rgba(24, 24, 32, 0.96)',
      },
    }),
    input: ({ theme }) => ({
      padding: theme.spacing(2.625, 3),
      fontSize: theme.typography.body2.fontSize,
      fontWeight: theme.typography.body1.fontWeight,
      color: theme.palette.text.secondary,
    }),
    disabled: ({ theme }) => ({
      backgroundColor: theme.palette.divider,
      '& :before': {
        borderBottom: 'none',
      },
    }),
    error: ({ theme }) => ({
      border: `1px solid ${theme.palette.error.main}`,
    }),
  },
}

export default FilledInput
